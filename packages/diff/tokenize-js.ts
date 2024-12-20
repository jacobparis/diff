import { IndentController } from "./indents"
import { tokenizeSubstrings } from "./tokenize-substrings"
import { Parser } from "acorn"

export function tokenizeJavaScript(sourceCode: string) {
  const tokens: Array<{ value: string; start: number; end: number }> = []
  const tokenizer = Parser.tokenizer(sourceCode, {
    ecmaVersion: "latest",
    sourceType: "module",
  })

  const indentController = new IndentController()
  let token = tokenizer.getToken()
  while (token.type.label !== "eof") {
    const value = sourceCode.slice(token.start, token.end)
    if (token.type.label === "string") {
      const subtokens = tokenizeSubstrings({ value, start: token.start })
      tokens.push(...subtokens)
    } else {
      if (token.type.label === "whitespace") {
        indentController.recordIndent(value)
      }
      tokens.push({ value, start: token.start, end: token.end })
    }

    token = tokenizer.getToken()
  }

  return {
    tokens,
    indentType: indentController.output.type,
    indentAmount: indentController.output.amount,
  }
}
