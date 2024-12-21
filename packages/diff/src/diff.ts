import { ArrayWriter } from "./array.js";
import { Writer } from "./writer.js";

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
}): ReturnType<TWriter['close']> {
  if (!writer) {
    // set default here so it doesn't instantiate every time the function is parsed
    writer = new ArrayWriter() as unknown as TWriter
  }
  // TODO: move skipTokens and normalizeToken strategies to a separate file
  // so they can be chosen by language
  const skipTokens = [";", ","]

  // Helper function to normalize tokens by removing wrapping quotes
  const normalizeToken = (token: string) => {
    if (
      (token.startsWith('"') && token.endsWith('"')) ||
      (token.startsWith("'") && token.endsWith("'"))
    ) {
      return token.slice(1, -1)
    }
    return token
  }

  // Helper function to check if two tokens differ only by whitespace
  const isWhitespaceOnlyChange = (tokenA: string) => {
    const matchWhitespaceOnly = /^\s*$/
    return matchWhitespaceOnly.test(tokenA)
  }

  const lcsMatrix = computeLCSMatrix(
    a.tokens.map((t) => ({
      ...t,
      // replace indents from A with indents from B
      value: normalizeToken(t.value).replaceAll(
        a.indentType.repeat(a.indentAmount),
        b.indentType.repeat(b.indentAmount)
      ),
    })),
    b.tokens.map((t) => ({ ...t, value: normalizeToken(t.value) }))
  )

  // Iterate forwards through the LCS matrix to generate the diff
  let i = 0
  let j = 0

  let whileLimit = 50000
  let operation: DiffOperation = { type: "equal", tokens: []  }
  while (
    (i < a.tokens.length || j < b.tokens.length) &&
    whileLimit-- >= 0
  ) {
    if (i < a.tokens.length && skipTokens.includes(a.tokens[i].value)) {
      // if skipped token is in A, skip it
      i++
      continue
    }
    if (j < b.tokens.length && skipTokens.includes(b.tokens[j].value)) {
      // if skipped token is in B, consider it equal
      if (operation.type !== "equal") {
        writer.write(operation)
        operation = { type: "equal", tokens: [] }
      }
      operation.tokens.push(b.tokens[j])
      j++
      continue
    }
    if (
      i < a.tokens.length &&
      j < b.tokens.length &&
      (normalizeToken(a.tokens[i].value) ===
        normalizeToken(b.tokens[j].value) ||
        (isWhitespaceOnlyChange(a.tokens[i].value) &&
          isWhitespaceOnlyChange(b.tokens[j].value)))
    ) {
      // Match found in LCS or semantically similar
      if (operation.type !== "equal") {
        writer.write(operation)
        operation = { type: "equal", tokens: [] }
      }

      // Default to B
      operation.tokens.push(b.tokens[j])
      i++
      j++
      continue
    }

    if (
      j < b.tokens.length &&
      (i >= a.tokens.length || lcsMatrix[i][j + 1] >= lcsMatrix[i + 1][j])
    ) {
      // Insert operation (token in B but not A)
      if (operation.type !== "insert") {
        writer.write(operation)
        operation = { type: "insert", tokens: [] }
      }

      // if (!isWhitespaceOnlyChange(tokensB[j - 1].value)) {
      operation.tokens.push(b.tokens[j])
      // }

      j++
      continue
    }

    // Delete operation (token in A but not B)
    if (operation.type !== "delete") {
      writer.write(operation)
      operation = { type: "delete", tokens: [] }
    }

    const token = a.tokens[i]
    token.value = token.value.replaceAll(
      a.indentType.repeat(a.indentAmount),
      b.indentType.repeat(b.indentAmount)
    )
    operation.tokens.push(token)

    i++
  }

  if (operation.tokens.length > 0) {
    writer.write(operation)
  }

  if (whileLimit <= 0) {
    throw new Error("while loop timeout")
  }

  return writer.close() as ReturnType<TWriter['close']>
}


// Helper function to compute the LCS matrix backwards
function computeLCSMatrix(
  tokensA: DiffToken[],
  tokensB: DiffToken[]
): number[][] {
  const lcsMatrix: number[][] = Array(tokensA.length + 1)
    .fill(null)
    .map(() => Array(tokensB.length + 1).fill(0))

  for (let i = tokensA.length - 1; i >= 0; i--) {
    for (let j = tokensB.length - 1; j >= 0; j--) {
      if (tokensA[i].value === tokensB[j].value) {
        lcsMatrix[i][j] = lcsMatrix[i + 1][j + 1] + 1
      } else {
        lcsMatrix[i][j] = Math.max(lcsMatrix[i + 1][j], lcsMatrix[i][j + 1])
      }
    }
  }

  return lcsMatrix
}
