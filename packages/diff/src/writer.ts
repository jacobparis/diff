import { DiffOperation } from "./diff.js"

export class Writer<T> {
  write(operation: DiffOperation) {
    throw new Error("Method 'write()' must be implemented.")
  }

  close(): T {
    throw new Error("Method 'close()' must be implemented.")
  }
}
