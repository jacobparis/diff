import { DiffOperation } from "./diff.js"
import { Writer } from "./writer.js"

export class ArrayWriter extends Writer<Array<DiffOperation>> {
  private operations: Array<DiffOperation> = []

  write(operation: DiffOperation) {
    this.operations.push(operation)
  }

  close() {
    return this.operations
  }
}

export function diffArrayToString(
  diffArray: Array<DiffOperation>,
  options: {
    omit?: Array<"insert" | "delete" | "equal">
    insertTagOpen?: string
    insertTagClose?: string
    deleteTagOpen?: string
    deleteTagClose?: string
    equalTagOpen?: string
    equalTagClose?: string
} = {}) {
  let omit = options.omit ?? []
  let insertTagOpen = options.insertTagOpen ?? "[+ "
  let insertTagClose = options.insertTagClose ?? " +]"
  let deleteTagOpen = options.deleteTagOpen ?? "[- "
  let deleteTagClose = options.deleteTagClose ?? " -]"
  let equalTagOpen = options.equalTagOpen ?? ""
  let equalTagClose = options.equalTagClose ?? ""

  let result = ""
  for (const change of diffArray) {
    if (change.type === "insert" && !omit.includes("insert")) {
      result += insertTagOpen
      for (const token of change.tokens) {
        result += token.value
      }
      result += insertTagClose
    }

    if (change.type === "delete" && !omit.includes("delete")) {
      result += deleteTagOpen
      for (const token of change.tokens) {
        result += token.value
      }
      result += deleteTagClose
    }

    if (change.type === "equal" && !omit.includes("equal")) {
      result += equalTagOpen
      for (const token of change.tokens) {
        result += token.value
      }
      result += equalTagClose
    }
  }

  return result
}
