# diff 

This is a simple human-readable and AI-readable diff tool. 

`GET` [https://pkgless-diff.jacobparis.workers.dev/](https://pkgless-diff.jacobparis.workers.dev/) - show example diff in text format

`GET` [https://pkgless-diff.jacobparis.workers.dev/html](https://pkgless-diff.jacobparis.workers.dev/html) - show example diff in html format

send a `POST` request to the same url with a body of `{ a: string, b: string, language: string }` to make your own diff

```sh
npm install @pkgless/diff
```

```ts
import {
  // convert code to tokens
  tokenize,

  // compare two sets of tokens
  diffTokens,
  
  // gets passed to diffTokens, makes it output Array<DiffOperation>
  ArrayWriter,
  
  // gets passed to diffTokens, makes it output ReadableStream<DiffOperation>
  ReadableStreamWriter,
  
  // convert ReadableStream<DiffOperation> to ReadableStream<string>
  diffStreamToTextStream,
  
  // convert ReadableStream<DiffOperation> to Promise<string>
  diffStreamToString,
  
  // convert Array<DiffOperation> to string
  diffArrayToString,
} from '@pkgless/diff'
```
## Features

- **Formatting Tolerance**: Ignores indents, semicolons, and trailing commas.
- **Word-Level Diff**: Breaks long strings into words for detailed diffs.

### synchronous

To get a diff synchronously, you can use the ArrayWriter which makes diffTokens return an array of DiffOperations. 

Then print it with `diffArrayToString`.

```ts
const diff = diffTokens({
  a: tokenize({
    content: a,
    language,
  }),
  b: tokenize({
    content: b,
    language,
  }),
  writer: new ArrayWriter(), // this is the default writer, so feel free to omit
})

const result = diffArrayToString(diff)
```

### streaming text

This API is streaming friendly. If you don't want to stream the final output, you can use `await diffStreamToString(stream)` to buffer the whole diff into a string. 

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
    writer: new ReadableStreamWriter(),
  })

  const stream = diffStreamToTextStream(diffStream)
  
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
    writer: new ReadableStreamWriter(),
  })
  const stream = diffStreamToTextStream(diffStream, {
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
