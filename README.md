# diff 

This is a simple human-readable and AI-readable diff tool. 

## Features

- **Formatting Tolerance**: Ignores indents, semicolons, and trailing commas.
- **Word-Level Diff**: Breaks long strings into words for detailed diffs.

## Usage


### tokenize

Converts source code into tokens, supporting JavaScript, TypeScript, and plain text.


```ts
function tokenize(args: {
  content: string
  language: string
}): {
  tokens: DiffToken[]
  indentType: string // "\t"
  indentAmount: number // 1
}
```

### diffTokens

Accepts the output of `tokenize` for two inputs and returns a ReadableStream of diff operations.

### streaming text

This API is streaming friendly. If you don't want to stream, you can use `await diffToString(stream)` to buffer the whole diff into a string. 

```ts
app.get('/diff', async (c) => {
  const { a, b, language } = exampleInput

  const diffStream = diffTokens({
    a: tokenize({
      content: a,
      language,
    }),
    b: tokenize({
      content: b,
      language,
    }),
  })

  const stream = diffToTextStream(diffStream)
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain',
    },
  })
})
```

## streaming html

```ts
app.get('/diff.html', async (c) => {
  const { a, b, language } = exampleInput

  const diffStream = diffTokens({
    a: tokenize({
      content: a,
      language,
    }),
    b: tokenize({
      content: b,
      language,
    }),
  })
  const stream = diffToTextStream(diffStream, {
    insertTagOpen: "<ins>",
    insertTagClose: "</ins>",
    deleteTagOpen: "<del>",
    deleteTagClose: "</del>",
  })

  const textEncoder = new TextEncoder()
  const responseStream = new ReadableStream({
    async start(controller) {
      // Enqueue the "before" HTML
      const beforeHTML = `
        <style>
          pre { tab-size: 2; }
          ins { background-color: #d4f0d4; }
          del { background-color: #f0d4d4; }
        </style>
        <pre>`
      controller.enqueue(textEncoder.encode(beforeHTML))

      // Enqueue the chunks from the original stream
      const reader = stream.getReader()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        controller.enqueue(value)
      }

      // Enqueue the "after" HTML
      controller.enqueue(textEncoder.encode('</pre>'))
      controller.close()
    },
  })

  return new Response(responseStream, {
    headers: {
      'Content-Type': 'text/html',
    },
  })
})
```   
