import { tokenizeJavaScript } from "./tokenize-js.js"
import { tokenizeTypeScript } from "./tokenize-ts.js"
import { tokenizeText } from "./tokenize-txt.js"

export function tokenize({
  content,
  language,
}: {
  content: string
  language: string
}) {
  switch (language) {
    case "typescript":
      return tokenizeTypeScript(content)
    case "javascript":
      return tokenizeJavaScript(content)
    default:
      return tokenizeText(content)
  }
}
