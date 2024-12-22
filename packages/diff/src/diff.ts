import { ArrayWriter } from "./array.js";
import { Writer } from "./writer.js";

export type DiffToken = { value: string; start: number; end: number }
export type DiffOperation =
  | { type: "equal"; tokens: DiffToken[] }
  | { type: "insert"; tokens: DiffToken[] }
  | { type: "delete"; tokens: DiffToken[] }
  // keep whitespace separate so we can isolate word changes
  | { type: "equal-whitespace"; tokens: DiffToken[] }
  | { type: "insert-whitespace"; tokens: DiffToken[] }
  | { type: "delete-whitespace"; tokens: DiffToken[] }

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
    writer = new ArrayWriter() as unknown as TWriter
  }

  const skipTokens = [";", ","]
  const normalizeToken = (token: string) => {
    if (
      (token.startsWith('"') && token.endsWith('"')) ||
      (token.startsWith("'") && token.endsWith("'"))
    ) {
      return token.slice(1, -1)
    }
    return token
  }
  const isWhitespace = (token: string) => /^\s*$/.test(token);

  const lcsMatrix = computeLCSMatrix(
    a.tokens.map((t) => ({
      ...t,
      value: normalizeToken(t.value).replaceAll(
        a.indentType.repeat(a.indentAmount),
        b.indentType.repeat(b.indentAmount)
      ),
    })),
    b.tokens.map((t) => ({ ...t, value: normalizeToken(t.value) }))
  )

  let i = 0
  let j = 0
  let whileLimit = 50000
  let operation: DiffOperation = { type: "equal", tokens: []  }

  while (
    (i < a.tokens.length || j < b.tokens.length) &&
    whileLimit-- >= 0
  ) {
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

    const aToken = i < a.tokens.length ? a.tokens[i] : null;
    const bToken = j < b.tokens.length ? b.tokens[j] : null;
    const aValue = aToken ? normalizeToken(aToken.value) : null;
    const bValue = bToken ? normalizeToken(bToken.value) : null;

    // unsure if this is correct, in theory for equality should be lcsMatrix[i][j] > lcsMatrix[i + 1][j + 1]
    // but that seems to match everything and not just the longest common subsequence
    if (aValue === bValue && lcsMatrix[i][j] > lcsMatrix[i + 1][j]) {
      if (operation.type !== "equal") {
        writer.write(operation);
        operation = { type: "equal", tokens: [] };
      }
      operation.tokens.push(bToken!);
      i++;
      j++;
      continue;
    }

    if (isWhitespace(aValue || '') && isWhitespace(bValue || '')) {
      if (operation.type !== "equal-whitespace") {
        writer.write(operation);
        operation = { type: "equal-whitespace", tokens: [] };
      }
      operation.tokens.push(bToken!);
      i++;
      j++;
      continue;
    }

    if (bToken && (i >= a.tokens.length || lcsMatrix[i][j + 1] >= lcsMatrix[i + 1][j])) {
      if (isWhitespace(bValue || '')) {
        if (operation.type !== "insert-whitespace") {
          writer.write(operation);
          operation = { type: "insert-whitespace", tokens: [] };
        }
      } else {
        if (operation.type !== "insert") {
          writer.write(operation);
          operation = { type: "insert", tokens: [] };
        }
      }
      operation.tokens.push(bToken);
      j++;
      continue;
    }

    if (aToken) {
      if (isWhitespace(aValue || '')) {
        if (operation.type !== "delete-whitespace") {
          writer.write(operation);
          operation = { type: "delete-whitespace", tokens: [] };
        }
      } else {
        if (operation.type !== "delete") {
          writer.write(operation);
          operation = { type: "delete", tokens: [] };
        }
      }
      const token = { ...aToken, value: aValue!.replaceAll(
        a.indentType.repeat(a.indentAmount),
        b.indentType.repeat(b.indentAmount)
      )};
      operation.tokens.push(token);
      i++;
    }
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
  const lcsMatrix: Array<Array<number>> = Array(tokensA.length + 1)
    .fill(null)
    .map(() => Array(tokensB.length + 1).fill(0));

  for (let i = tokensA.length - 1; i >= 0; i--) {
    for (let j = tokensB.length - 1; j >= 0; j--) {
      if (tokensA[i].value === tokensB[j].value && !/^\s+$/.test(tokensA[i].value)) {
        lcsMatrix[i][j] = lcsMatrix[i + 1][j + 1] + 1;
      } else {
        lcsMatrix[i][j] = Math.max(lcsMatrix[i + 1][j], lcsMatrix[i][j + 1]);
      }
    }
  }


  return lcsMatrix;
}
