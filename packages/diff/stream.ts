import { DiffOperation } from "./diff"

export function diffToTextStream(
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

export async function diffToString(
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
  const stream = diffToTextStream(diffStream, options)
  const reader = stream.getReader()
  let result = ""
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    result += value
  }
  return result
}
