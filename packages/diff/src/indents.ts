const INDENT_REGEX = /^(?:( ){2,}|\t+)/
const INDENT_TYPE_SPACE = " "
const INDENT_TYPE_TAB = "\t"

function encodeIndentsKey(indentType: string, indentAmount: number) {
  const typeCharacter = indentType === INDENT_TYPE_SPACE ? "s" : "t"
  return typeCharacter + String(indentAmount)
}

function decodeIndentsKey(indentsKey: string) {
  const keyHasTypeSpace = indentsKey[0] === "s"
  const type = keyHasTypeSpace ? INDENT_TYPE_SPACE : INDENT_TYPE_TAB
  const amount = Number(indentsKey.slice(1))
  return { type, amount }
}

function getMostUsedKey(indents: Map<string, [number, number]>) {
  let result
  let maxUsed = 0
  let maxWeight = 0

  for (const [key, [usedCount, weight]] of indents) {
    if (usedCount > maxUsed || (usedCount === maxUsed && weight > maxWeight)) {
      maxUsed = usedCount
      maxWeight = weight
      result = key
    }
  }

  return result
}

export class IndentController {
  private indents: Map<string, [number, number]> = new Map()
  private previousSize = 0
  private previousIndentType: string | undefined
  private key: string | undefined

  constructor() {}

  recordIndent(value: string) {
    const matches = value.match(INDENT_REGEX)
    if (matches !== null) {
      const indent = matches[0].length
      const indentType = matches[1] ? INDENT_TYPE_SPACE : INDENT_TYPE_TAB

      if (indentType !== this.previousIndentType) {
        this.previousSize = 0
      }

      this.previousIndentType = indentType

      const indentDifference = indent - this.previousSize
      this.previousSize = indent

      if (indentDifference !== 0) {
        const absoluteIndentDifference = Math.abs(indentDifference)
        this.key = encodeIndentsKey(indentType, absoluteIndentDifference)
      }

      if (this.key) {
        const entry = this.indents.get(this.key) || [0, 0]
        this.indents.set(this.key, [entry[0] + 1, entry[1]])
      }
    }
  }

  get output() {
    const keyOfMostUsedIndent = getMostUsedKey(this.indents)
    let type = "\t"
    let amount = 1

    if (keyOfMostUsedIndent !== undefined) {
      ;({ type, amount } = decodeIndentsKey(keyOfMostUsedIndent))
    }

    return {
      type,
      amount,
    }
  }
}
