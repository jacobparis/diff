import { ArrayWriter } from "./array.js"
import { Writer } from "./writer.js"

export type DiffToken = { value: string; start: number; end: number }
export type DiffOperation =
  | { type: "equal"; tokens: DiffToken[] }
  | { type: "insert"; tokens: DiffToken[] }
  | { type: "delete"; tokens: DiffToken[] }

export function diffTokens<TWriter extends Writer<unknown> = ArrayWriter>({
  a,
  b,
  writer,
}: {
  a: {
    tokens: DiffToken[]
    indentType: string
    indentAmount: number
  }
  b: {
    tokens: DiffToken[]
    indentType: string
    indentAmount: number
  }
  writer?: TWriter
}): ReturnType<TWriter["close"]> {
  if (!writer) {
    writer = new ArrayWriter() as unknown as TWriter
  }

  const hashCache = new Map<string, string>()

  const skipTokens = [";", ","]

  const lcsMatrix = computeLCSMatrix(a.tokens, b.tokens)

  // The LCS matrix is computed backwards (bottom-right to top-left)
  // At each position [i,j], the value represents the length of the longest common subsequence
  // that can be formed using tokens from position i onwards in A and j onwards in B
  let i = 0
  let j = 0
  let whileLimit =
    Math.max(
      a.tokens.length + b.tokens.length,
      a.tokens.length * b.tokens.length
    ) * 2 // margin for error
  let operation: DiffOperation = { type: "equal", tokens: [] }
  while ((i < a.tokens.length || j < b.tokens.length) && whileLimit-- >= 0) {
    if (i < a.tokens.length && skipTokens.includes(a.tokens[i].value)) {
      i++
      continue
    }
    if (j < b.tokens.length && skipTokens.includes(b.tokens[j].value)) {
      if (operation.type !== "equal") {
        writer.write(operation)
        operation = { type: "equal", tokens: [] }
      }
      operation.tokens.push(b.tokens[j])
      j++
      continue
    }

    const aToken =
      i < a.tokens.length
        ? {
            ...a.tokens[i],
            value: a.tokens[i].value.replaceAll(
              a.indentType.repeat(a.indentAmount),
              b.indentType.repeat(b.indentAmount)
            ),
          }
        : null
    const bToken = j < b.tokens.length ? b.tokens[j] : null

    // Handle cases where either token is null (end of sequence)
    if (!aToken) {
      // Only B tokens remain, mark as insertions
      if (operation.type !== "insert") {
        writer.write(operation)
        operation = { type: "insert", tokens: [] }
      }

      if (bToken) {
        operation.tokens.push(bToken)
        j++
      }
      continue
    }

    if (!bToken) {
      // Only A tokens remain, mark as deletions
      if (operation.type !== "delete") {
        writer.write(operation)
        operation = { type: "delete", tokens: [] }
      }

      if (aToken) {
        operation.tokens.push(aToken)
        i++
      }
      continue
    }

    // hash aValue and bValue so we can compare them
    // but then use aToken and bToken for the actual diff
    // because we need to preserve the original token
    const aValue = hashToken(aToken.value)
    const bValue = hashToken(bToken.value)

    // When we find matching tokens, we need to verify this match is part of a longer subsequence
    // We compare with the value below (i+1,j) because:
    // 1. If this match is part of the LCS, the value at (i,j) should be greater than (i+1,j)
    // 2. Comparing with (i+1,j+1) would match any equal tokens, even if they're not part of the LCS
    if (aValue === bValue && lcsMatrix[i][j] > lcsMatrix[i + 1][j]) {
      if (operation.type !== "equal") {
        writer.write(operation)
        operation = { type: "equal", tokens: [] }
      }
      operation.tokens.push(bToken)
      i++
      j++
      continue
    }

    if (
      bToken &&
      (i >= a.tokens.length || lcsMatrix[i][j + 1] >= lcsMatrix[i + 1][j])
    ) {
      if (operation.type !== "insert") {
        writer.write(operation)
        operation = { type: "insert", tokens: [] }
      }
      operation.tokens.push(bToken)
      j++
      continue
    }

    if (aToken) {
      if (operation.type !== "delete") {
        writer.write(operation)
        operation = { type: "delete", tokens: [] }
      }
      operation.tokens.push(aToken)
      i++
    }
  }

  if (operation.tokens.length > 0) {
    writer.write(operation)
    operation = { type: "equal", tokens: [] }
  }

  if (whileLimit <= 0) {
    throw new Error("while loop timeout")
  }

  return writer.close() as ReturnType<TWriter["close"]>

  // Helper function to compute the LCS matrix backwards
  function computeLCSMatrix(
    tokensA: DiffToken[],
    tokensB: DiffToken[]
  ): number[][] {
    const timeStart = performance.now()
    const WINDOW_SIZE = 200 // Adjust based on testing
    const lcsMatrix: Array<Array<number>> = Array(tokensA.length + 1)
      .fill(null)
      .map(() => Array(tokensB.length + 1).fill(0))

    for (let i = tokensA.length - 1; i >= 0; i--) {
      // Calculate window boundaries relative to the current position
      const windowStart = Math.max(0, i - WINDOW_SIZE)
      const windowEnd = Math.min(tokensB.length, i + WINDOW_SIZE)

      for (let j = windowEnd - 1; j >= windowStart; j--) {
        const aValue = hashToken(tokensA[i].value)
        const bValue = hashToken(tokensB[j].value)

        if (aValue === bValue) {
          lcsMatrix[i][j] = lcsMatrix[i + 1][j + 1] + 1
        } else {
          lcsMatrix[i][j] = Math.max(lcsMatrix[i + 1][j], lcsMatrix[i][j + 1])
        }
      }
    }

    return lcsMatrix
  }

  function hashToken(token: string) {
    if (hashCache.has(token)) {
      return hashCache.get(token)!
    }

    const result = []
    let lastWasSpace = false

    for (let i = 0; i < token.length; i++) {
      const c = token[i]

      // Check for whitespace
      if (
        c === " " ||
        c === "\t" ||
        c === "\n" ||
        c === "\r" ||
        c === "\f" ||
        c === "\v"
      ) {
        if (!lastWasSpace) {
          result.push(" ")
          lastWasSpace = true
        }
      } else if (c === '"' || c === "'" || c === "`") {
        // Normalize quotes
        result.push('"')
        lastWasSpace = false
      } else {
        result.push(c)
        lastWasSpace = false
      }
    }

    const hash = result.join("")
    hashCache.set(token, hash)
    return hash
  }
}
