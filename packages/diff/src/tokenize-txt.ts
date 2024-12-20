import { DiffToken } from "./diff.js"

export function tokenizeText(sourceCode: string) {
  const tokens: Array<DiffToken> = []
  const regex = /\S+/g
  let match

  while ((match = regex.exec(sourceCode)) !== null) {
    const value = match[0]
    const start = match.index
    const end = start + value.length

    tokens.push({ value, start, end })
  }

  return {
    tokens,
    indentType: " ",
    indentAmount: 1,
  }
}
