import { DiffOperation } from "./diff.js"
import { Writer } from "./writer.js"
export class ReadableStreamWriter extends Writer<ReadableStream<DiffOperation>> {
  private stream: ReadableStream<DiffOperation>
  private controller: ReadableStreamDefaultController<DiffOperation> | null = null

  constructor() {
    super()
    this.stream = new ReadableStream({
      start: (controller) => {
        this.controller = controller
      }
    })
  }

  write(operation: DiffOperation) {
    if (this.controller) {
      this.controller.enqueue(operation)
    }
  }

  close() {
    if (this.controller) {
      this.controller.close()
    }

    return this.stream
  }
}


export function diffStreamToTextStream(
  diffStream: ReadableStream<DiffOperation>,
  options: {
    omit?: Array<"insert" | "delete" | "equal">
    insertTagOpen?: string
    insertTagClose?: string
    deleteTagOpen?: string
    deleteTagClose?: string
    equalTagOpen?: string
    equalTagClose?: string
  } = {}
) {
  let omit = options.omit ?? []
  let insertTagOpen = options.insertTagOpen ?? "[+ "
  let insertTagClose = options.insertTagClose ?? " +]"
  let deleteTagOpen = options.deleteTagOpen ?? "[- "
  let deleteTagClose = options.deleteTagClose ?? " -]"
  let equalTagOpen = options.equalTagOpen ?? ""
  let equalTagClose = options.equalTagClose ?? ""

  const encoder = new TextEncoder()
  const transformStream = new TransformStream<DiffOperation, Uint8Array>({
    transform(change, controller) {
      let chunk = ""
      if (change.type === "insert" && !omit.includes("insert")) {
        chunk += insertTagOpen
        for (const token of change.tokens) {
          chunk += token.value
        }
        chunk += insertTagClose
      }

      if (change.type === "delete" && !omit.includes("delete")) {
        chunk += deleteTagOpen
        for (const token of change.tokens) {
          chunk += token.value
        }
        chunk += deleteTagClose
      }

      if (change.type === "equal" && !omit.includes("equal")) {
        chunk += equalTagOpen
        for (const token of change.tokens) {
          chunk += token.value
        }
        chunk += equalTagClose
      }

      if (chunk) {
        controller.enqueue(encoder.encode(chunk))
      }
    },
  })

  return diffStream.pipeThrough(transformStream)
}

export async function diffStreamToString(
  diffStream: ReadableStream<DiffOperation>,
  options: {
    omit?: Array<"insert" | "delete" | "equal">
    insertTagOpen?: string
    insertTagClose?: string
    deleteTagOpen?: string
    deleteTagClose?: string
    equalTagOpen?: string
    equalTagClose?: string
  } = {}
) {
  const stream = diffStreamToTextStream(diffStream, options)
  const decoder = new TextDecoder()
  const reader = stream.getReader()
  let result = ""
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    result += decoder.decode(value, { stream: true })
  }
  return result
}
