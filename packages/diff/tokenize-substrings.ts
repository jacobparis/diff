export function tokenizeSubstrings({
  value,
  start,
}: {
  value: string
  start: number
}) {
  // Split string literals containing spaces into separate tokens
  let state = "isQuote" as "isQuote" | "isSpace" | "isChar"

  const tokens = []
  const buffer = []
  let subStart = start
  for (let i = 0; i < value.length; i++) {
    const char = value[i]
    if (["`", '"', "'"].includes(char)) {
      if (state !== "isQuote") {
        tokens.push({
          value: buffer.join(""),
          start: subStart,
          end: subStart + buffer.length,
        })
        buffer.length = 0
        subStart = i
      }
      state = "isQuote"
    } else if (char === " ") {
      if (state !== "isSpace") {
        tokens.push({
          value: buffer.join(""),
          start: subStart,
          end: subStart + buffer.length,
        })
        buffer.length = 0
        subStart = i
      }
      state = "isSpace"
    } else {
      if (state !== "isChar") {
        tokens.push({
          value: buffer.join(""),
          start: subStart,
          end: subStart + buffer.length,
        })
        buffer.length = 0
        subStart = i
      }
      state = "isChar"
    }
    buffer.push(char)
  }

  // push remaining tokens
  tokens.push({
    value: buffer.join(""),
    start: subStart,
    end: value.length,
  })

  return tokens
}
