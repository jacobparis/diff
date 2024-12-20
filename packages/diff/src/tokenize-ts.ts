import ts from "typescript"
import { tokenizeSubstrings } from "./tokenize-substrings.js"
import { DiffToken } from "./diff.js"
import { IndentController } from "./indents.js"

export function tokenizeTypeScript(sourceCode: string) {
  const tokens: Array<DiffToken> = []
  const scanner = ts.createScanner(
    ts.ScriptTarget.Latest,
    false,
    ts.LanguageVariant.Standard,
    sourceCode
  )

  const indentController = new IndentController()

  let whileLimit = 10_000
  let token = scanner.scan()
  while (token !== ts.SyntaxKind.EndOfFileToken && whileLimit-- >= 0) {
    const start = scanner.getTokenStart()
    const end = scanner.getTokenEnd()
    let value = sourceCode.slice(start, end)

    if (token === ts.SyntaxKind.StringLiteral && value.includes(" ")) {
      // split string literals containing spaces into separate tokens
      const subtokens = tokenizeSubstrings({ value, start })
      tokens.push(...subtokens)
    } else {
      if (token === ts.SyntaxKind.WhitespaceTrivia) {
        indentController.recordIndent(value)
      }
      tokens.push({ value, start, end })
    }

    token = scanner.scan()
  }

  if (whileLimit <= 0) {
    throw new Error("While limit reached")
  }

  return {
    tokens,
    indentType: indentController.output.type,
    indentAmount: indentController.output.amount,
  }
}
