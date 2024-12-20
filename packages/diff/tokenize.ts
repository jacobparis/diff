import { tokenizeJavaScript } from "./tokenize-js"
import { tokenizeTypeScript } from "./tokenize-ts"
import { tokenizeText } from "./tokenize-txt"

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
