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
  } = {}
) {
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

export function diffStringToArray(
  diffString: string,
  options: {
    insertTagOpen?: string
    insertTagClose?: string
    deleteTagOpen?: string
    deleteTagClose?: string
    equalTagOpen?: string
    equalTagClose?: string
  } = {}
) {
  const insertTagOpen = options.insertTagOpen ?? "[+ "
  const insertTagClose = options.insertTagClose ?? " +]"
  const deleteTagOpen = options.deleteTagOpen ?? "[- "
  const deleteTagClose = options.deleteTagClose ?? " -]"
  const equalTagOpen = options.equalTagOpen ?? ""
  const equalTagClose = options.equalTagClose ?? ""

  const operations: Array<DiffOperation> = []
  let currentIndex = 0

  // Check if this looks like a unified diff format (has lines starting with + or -)
  const lines = diffString.split("\n")
  const hasUnifiedDiffMarkers = lines.some(
    (line) =>
      (line.startsWith("+") || line.startsWith("-")) &&
      !line.startsWith("++") &&
      !line.startsWith("--")
  )

  if (hasUnifiedDiffMarkers) {
    for (const line of lines) {
      // Skip diff metadata lines
      if (line.startsWith("@@")) {
        currentIndex += line.length + 1
        continue
      }

      if (line.startsWith("+")) {
        operations.push({
          type: "insert",
          tokens: [
            {
              value: line.slice(1) + "\n",
              start: currentIndex,
              end: currentIndex + line.length,
            },
          ],
        })
      } else if (line.startsWith("-")) {
        operations.push({
          type: "delete",
          tokens: [
            {
              value: line.slice(1) + "\n",
              start: currentIndex,
              end: currentIndex + line.length,
            },
          ],
        })
      } else {
        // Remove leading space from unchanged lines to match add/delete indentation
        const value = line.startsWith(" ") ? line.slice(1) : line
        operations.push({
          type: "equal",
          tokens: [
            {
              value: value + "\n",
              start: currentIndex,
              end: currentIndex + line.length,
            },
          ],
        })
      }
      currentIndex += line.length + 1 // +1 for the newline
    }
    return operations
  }

  // Handle tag-based format
  while (currentIndex < diffString.length) {
    if (diffString.startsWith(insertTagOpen, currentIndex)) {
      const contentStart = currentIndex + insertTagOpen.length
      const contentEnd = diffString.indexOf(insertTagClose, contentStart)
      if (contentEnd === -1) throw new Error("Missing insert tag close")

      const content = diffString.slice(contentStart, contentEnd)
      operations.push({
        type: "insert",
        tokens: [{ value: content, start: contentStart, end: contentEnd }],
      })
      currentIndex = contentEnd + insertTagClose.length
    } else if (diffString.startsWith(deleteTagOpen, currentIndex)) {
      const contentStart = currentIndex + deleteTagOpen.length
      const contentEnd = diffString.indexOf(deleteTagClose, contentStart)
      if (contentEnd === -1) throw new Error("Missing delete tag close")

      const content = diffString.slice(contentStart, contentEnd)
      operations.push({
        type: "delete",
        tokens: [{ value: content, start: contentStart, end: contentEnd }],
      })
      currentIndex = contentEnd + deleteTagClose.length
    } else {
      let contentEnd
      if (equalTagOpen === "" && equalTagClose === "") {
        // If no equal tags, read until next insert or delete tag, or end of string
        const nextInsert = diffString.indexOf(insertTagOpen, currentIndex)
        const nextDelete = diffString.indexOf(deleteTagOpen, currentIndex)
        contentEnd = Math.min(
          nextInsert === -1 ? Infinity : nextInsert,
          nextDelete === -1 ? Infinity : nextDelete
        )
        if (contentEnd === Infinity) contentEnd = diffString.length
      } else {
        const contentStart = currentIndex + equalTagOpen.length
        contentEnd = diffString.indexOf(equalTagClose, contentStart)
        if (contentEnd === -1) throw new Error("Missing equal tag close")
        contentEnd += equalTagClose.length
      }

      if (contentEnd > currentIndex) {
        const content = diffString.slice(
          currentIndex + equalTagOpen.length,
          contentEnd - (equalTagClose.length || 0)
        )
        if (content) {
          operations.push({
            type: "equal",
            tokens: [{ value: content, start: currentIndex, end: contentEnd }],
          })
        }
      }
      currentIndex = contentEnd
    }
  }

  return operations
}
