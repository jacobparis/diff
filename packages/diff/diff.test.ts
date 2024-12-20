import { describe, it, expect } from "vitest"
import { tokenize } from "./tokenize"
import { diffTokens } from "./diff"
import { diffToString } from "./stream"

const changeQuotes = {
  a: "import * as React from 'react'",
  b: 'import * as React from "react"',
  language: "typescript",
}

const removeSemi = {
  a: "import * as React from 'react';",
  b: "import * as React from 'react'",
  language: "typescript",
}

const addSemi = {
  a: "import * as React from 'react'",
  b: "import * as React from 'react';",
  language: "typescript",
}

const input = {
  a: 'import * as React from "react"\nimport { Slot } from "@radix-ui/react-slot"\nimport { cva, type VariantProps } from "class-variance-authority"\n\nimport { cn } from "@/lib/utils"\n\nconst buttonVariants = cva(\n  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",\n  {\n    variants: {\n      variant: {\n        default: "bg-primary text-primary-foreground hover:bg-primary/90",\n        destructive:\n          "bg-destructive text-destructive-foreground hover:bg-destructive/90",\n        outline:\n          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",\n        secondary:\n          "bg-secondary text-secondary-foreground hover:bg-secondary/80",\n        ghost: "hover:bg-accent hover:text-accent-foreground",\n        link: "text-primary underline-offset-4 hover:underline",\n      },\n      size: {\n        default: "h-10 px-4 py-2",\n        sm: "h-9 rounded-md px-3",\n        lg: "h-11 rounded-md px-8",\n        icon: "h-10 w-10",\n      },\n    },\n    defaultVariants: {\n      variant: "default",\n      size: "default",\n    },\n  }\n)\n\nexport interface ButtonProps\n  extends React.ButtonHTMLAttributes<HTMLButtonElement>,\n    VariantProps<typeof buttonVariants> {\n  asChild?: boolean\n}\n\nconst Button = React.forwardRef<HTMLButtonElement, ButtonProps>(\n  ({ className, variant, size, asChild = false, ...props }, ref) => {\n    const Comp = asChild ? Slot : "button"\n    return (\n      <Comp\n        className={cn(buttonVariants({ variant, size, className }))}\n        ref={ref}\n        {...props}\n      />\n    )\n  }\n)\nButton.displayName = "Button"\n\nexport { Button, buttonVariants }\n',
  b: "import { Slot } from '@radix-ui/react-slot';\nimport { cva, type VariantProps } from 'class-variance-authority';\nimport * as React from 'react';\n\nimport { cn } from '#app/utils/misc.ts';\n\nconst buttonVariants = cva(\n\t'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',\n\t{\n\t\tvariants: {\n\t\t\tvariant: {\n\t\t\t\tdefault: 'bg-primary text-primary-foreground shadow hover:bg-primary/90',\n\t\t\t\tdestructive: 'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',\n\t\t\t\toutline:\n\t\t\t\t\t'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground',\n\t\t\t\tsecondary:\n\t\t\t\t\t'bg-secondary text-secondary-foreground shadow-sm hover:brightness-95 transition-all',\n\t\t\t\tghost: 'hover:bg-accent hover:text-accent-foreground',\n\t\t\t\tlink: 'text-primary underline-offset-4 hover:underline',\n\t\t\t},\n\t\t\tsize: {\n\t\t\t\tdefault: 'h-9 px-3 py-2',\n\t\t\t\tline: 'h-8 px-3 w-full justify-start',\n\t\t\t\tsm: 'h-8 px-3 text-xs',\n\t\t\t\tlg: 'h-10 px-8',\n\t\t\t\ticon: 'h-9 w-9',\n\t\t\t},\n\t\t},\n\t\tdefaultVariants: {\n\t\t\tvariant: 'default',\n\t\t\tsize: 'default',\n\t\t},\n\t},\n);\n\nexport type ButtonProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type'> &\n\tVariantProps<typeof buttonVariants> &\n\t(\n\t\t| {\n\t\t\t\tasChild: true;\n\t\t  }\n\t\t| {\n\t\t\t\tasChild?: false;\n\t\t\t\ttype: 'button' | 'submit' | 'reset';\n\t\t  }\n\t);\n\nconst Button = ({ className, variant, size, asChild = false, ...props }: ButtonProps) => {\n\tconst Comp = asChild ? Slot : 'button';\n\treturn <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />;\n};\nButton.displayName = 'Button';\n\nexport { Button, buttonVariants };\n",
  language: "typescript",
}

describe("Reconstruct with Removals Omitted", () => {
  it("should return identical code for simple comparison", async () => {
    const aCode = "const a = 1;"
    const bCode = "const a = 1;"

    const diff = diffTokens({
      a: tokenize({
        content: aCode,
        language: "typescript",
      }),
      b: tokenize({
        content: bCode,
        language: "typescript",
      }),
    })

    const result = await diffToString(diff)
    expect(result).toBe(bCode)
  })

  it("with deletions omitted, should return bCode", async () => {
    const aCode = changeQuotes.a
    const bCode = changeQuotes.b

    const diff = diffTokens({
      a: tokenize({
        content: aCode,
        language: "typescript",
      }),
      b: tokenize({
        content: bCode,
        language: "typescript",
      }),
    })

    const result = await diffToString(diff, { omit: ["delete"] })
    expect(result).toBe(bCode)
  })

  it("with deletions omitted, should return bCode", async () => {
    const aCode = removeSemi.a
    const bCode = removeSemi.b

    const diff = diffTokens({
      a: tokenize({
        content: aCode,
        language: "typescript",
      }),
      b: tokenize({
        content: bCode,
        language: "typescript",
      }),
    })

    const result = await diffToString(diff, { omit: ["delete"] })
    expect(result).toBe(bCode)
  })

  it("with deletions omitted, should return bCode", async () => {
    const aCode = addSemi.a
    const bCode = addSemi.b

    const diff = diffTokens({
      a: tokenize({
        content: aCode,
        language: "typescript",
      }),
      b: tokenize({
        content: bCode,
        language: "typescript",
      }),
    })

    const result = await diffToString(diff, { omit: ["delete"] })
    expect(result).toBe(bCode)
  })

  it("with deletions omitted, should return bCode", async () => {
    const aCode = input.a
    const bCode = input.b

    const diff = diffTokens({
      a: tokenize({
        content: aCode,
        language: "typescript",
      }),
      b: tokenize({
        content: bCode,
        language: "typescript",
      }),
    })

    const result = await diffToString(diff, {
      omit: ["delete"],
      insertTagOpen: "",
      insertTagClose: "",
    })
    expect(result).toBe(bCode)
  })
})
