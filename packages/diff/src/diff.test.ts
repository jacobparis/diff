import { describe, it, expect } from "vitest"
import { tokenize } from "./tokenize.js"
import { diffTokens } from "./diff.js"
import { diffArrayToString, diffStringToArray } from "./array.js"
import { diffStreamToString, ReadableStreamWriter } from "./stream.js"
import files from "./files.js"

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

    const result = diffArrayToString(diff)
    expect(result).toBe(bCode)
  })

  it("with deletions omitted, should return bCode", async () => {
    const changeQuotes = {
      a: "import * as React from 'react'",
      b: 'import * as React from "react"',
      language: "typescript",
    }
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

    const result = diffArrayToString(diff, { omit: ["delete"] })
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

    const result = diffArrayToString(diff, { omit: ["delete"] })
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

    const result = diffArrayToString(diff, { omit: ["delete"] })
    expect(result).toBe(bCode)
  })

  it("with deletions omitted, should return bCode in array", async () => {
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

    const result = diffArrayToString(diff, {
      omit: ["delete"],
      insertTagOpen: "",
      insertTagClose: "",
    })
    expect(result).toBe(bCode)
  })

  it("with deletions omitted, should return bCode in stream", async () => {
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
      writer: new ReadableStreamWriter(),
    })

    const result = await diffStreamToString(diff, {
      omit: ["delete"],
      insertTagOpen: "",
      insertTagClose: "",
    })
    expect(result).toBe(bCode)
  })

  it("should return bCode", async () => {
    const diff = diffTokens({
      a: tokenize({
        content: files.aContent,
        language: "typescript",
      }),
      b: tokenize({
        content: files.bContent,
        language: "typescript",
      }),
    })

    const result = diffArrayToString(diff, {
      omit: ["delete"],
      insertTagOpen: "",
      insertTagClose: "",
    })

    expect(result).toBe(files.bContent)
  })
})

describe("Additional Diff Tests", () => {
  it("should handle whitespace changes", async () => {
    const aCode = "function test() {\n  return true\n}"
    const bCode = "function test(){\nreturn true\n}"

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

    const result = diffArrayToString(diff, { omit: ["delete", "insert"] })
    // We just verify the functional code remains after omitting changes
    expect(result).toContain("function test()")
    expect(result).toContain("return true")
  })

  it("should handle comment changes appropriately", async () => {
    const aCode = "// old comment\nconst x = 1;"
    const bCode = "// new comment\nconst x = 1;"

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

    const result = diffArrayToString(diff)
    expect(result).toContain("[- old -]")
    expect(result).toContain("[+ new +]")
  })

  it("should handle multiple changes in the same line", async () => {
    const aCode = "const x = 1, y = 2;"
    const bCode = "let x = 2, y = 3;"

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

    const result = diffArrayToString(diff)
    expect(result).toContain("[- const")
    expect(result).toContain("[+ let")
    expect(result).toContain("[- 1")
    expect(result).toContain("[+ 2")
    expect(result).toContain("[- 2")
    expect(result).toContain("[+ 3")
  })

  it("should handle string content changes", async () => {
    const aCode = `const str = "hello world";`
    const bCode = `const str = 'hello earth';`

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

    const result = diffArrayToString(diff)
    // Check that the word changes are marked
    expect(result).toContain("[- world")
    expect(result).toContain("[+ earth")
  })

  it("should efficiently handle large blocks of unchanged code", async () => {
    const commonCode = "// Many lines of code\n".repeat(100)
    const aCode = commonCode + "const x = 1;"
    const bCode = commonCode + "const x = 2;"

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

    const result = diffArrayToString(diff)
    expect(result).toContain("[- 1")
    expect(result).toContain("[+ 2")
    // The common code should be preserved without diff markers
    expect(result.match(/\[\+|\[-/g)?.length).toBe(2)
  })
})

describe("Tailwind Class Changes", () => {
  it("should mark single class addition as a word change", async () => {
    const aCode = '<div className="px-4 py-2"></div>'
    const bCode = '<div className="px-4 py-2 mt-2"></div>'

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

    const result = diffArrayToString(diff)
    // Should show mt-2 as an addition without marking the whole className
    expect(result).toContain("[+  mt-2")
    expect(result).not.toContain("[- px-4")
    expect(result).not.toContain("[- py-2")
  })

  it("should mark single class removal as a word change", async () => {
    const aCode = '<div className="px-4 py-2 mt-2"></div>'
    const bCode = '<div className="px-4 py-2"></div>'

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

    const result = diffArrayToString(diff)
    // Should show mt-2 as a deletion without marking the whole className
    expect(result).toContain("[-  mt-2")
    expect(result).not.toContain("[+ px-4")
    expect(result).not.toContain("[+ py-2")
  })

  it("should handle multiple class changes efficiently", async () => {
    const aCode = '<div className="px-4 py-2 mt-2 text-sm"></div>'
    const bCode = '<div className="px-4 py-2 mt-4 text-lg"></div>'

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

    const result = diffArrayToString(diff)
    // Should show specific class changes without affecting unchanged classes
    expect(result).toContain("[- mt-2")
    expect(result).toContain("[+ mt-4")
    expect(result).toContain("[- text-sm")
    expect(result).toContain("[+ text-lg")
    expect(result).not.toContain("[- px-4")
    expect(result).not.toContain("[- py-2")
  })
})

describe("Line Removal Test", () => {
  it("should mark the whole line as removed", async () => {
    const originalCode = `const SIDEBAR_COOKIE_MAX_AGE=3600\nconst SIDEBAR_WIDTH = "16rem"`
    const modifiedCode = `const SIDEBAR_WIDTH = "16rem"`

    const diff = diffTokens({
      a: tokenize({
        content: originalCode,
        language: "typescript",
      }),
      b: tokenize({
        content: modifiedCode,
        language: "typescript",
      }),
    })

    const result = diffArrayToString(diff)
    // Ensure the whole line is marked as removed
    expect(result).toMatchInlineSnapshot(`
      "[- const SIDEBAR_COOKIE_MAX_AGE=3600
       -]const SIDEBAR_WIDTH = "16rem""
    `)
  })
})

describe("Function Overlap Test", () => {
  it("should recognize overlapping changes in toggleSidebar function", async () => {
    const { aContent, bContent } = {
      aContent:
        "// This sets the cookie to keep the sidebar state.\ndocument.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`\n},\n[setOpenProp, open]\n)\n\n// Helper to toggle the sidebar.\nconst toggleSidebar = React.useCallback(() => {\nreturn isMobile\n? setOpenMobile((open) => !open)\n: setOpen((open) => !open)\n}, [isMobile, setOpen, setOpenMobile])\n",
      bContent:
        "// This sets the cookie to keep the sidebar state.\ndocument.cookie = `${SIDEBAR_COOKIE_NAME}=${open}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`\n},\n[setOpenProp, open],\n)\n\n// Helper to toggle the sidebar.\nconst toggleSidebar = React.useCallback(() => {\nreturn isMobile ? setOpenMobile((open) => !open) : setOpen((open) => !open)\n}, [isMobile, setOpen, setOpenMobile])\n",
    }

    const diff = diffTokens({
      a: tokenize({
        content: aContent,
        language: "typescript",
      }),
      b: tokenize({
        content: bContent,
        language: "typescript",
      }),
    })

    const result = diffArrayToString(diff, { omit: ["insert", "delete"] })

    // First two lines are identical and should be equal
    expect(result).toContain(`// This sets the cookie to keep the sidebar state.
document.cookie = \`\${SIDEBAR_COOKIE_NAME}`)
    // Check that the overlapping parts are recognized
    expect(result).toContain(`// Helper to toggle the sidebar.
const toggleSidebar = React.useCallback(() => {`)
  })

  it("should handle multi-line tokens", async () => {
    const { aContent, bContent } = {
      aContent:
        'SidebarMenuBadge.displayName = "SidebarMenuBadge"\n\nconst SidebarMenuSub = React.forwardRef<\nHTMLUListElement,\nReact.ComponentProps<"ul">\n>(({ className, ...props }, ref) => (\n<ul\nref={ref}\ndata-sidebar="menu-sub"\nclassName={cn(\n"mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l border-sidebar-border px-2.5 py-0.5",\n"group-data-[collapsible=icon]:hidden",\nclassName\n)}\n{...props}\n/>\n))\nSidebarMenuSub.displayName = "SidebarMenuSub"\n\nconst SidebarMenuSubItem = React.forwardRef<\nHTMLLIElement,\nReact.ComponentProps<"li">\n>(({ ...props }, ref) => <li ref={ref} {...props} />)\nSidebarMenuSubItem.displayName = "SidebarMenuSubItem"\n\nconst SidebarMenuSubButton = React.forwardRef<\nHTMLAnchorElement,\nReact.ComponentProps<"a"> & {\nasChild?: boolean\nsize?: "sm" | "md"\nisActive?: boolean\n}\n>(({ asChild = false, size = "md", isActive, className, ...props }, ref) => {\nconst Comp = asChild ? Slot : "a"\n\nreturn (\n<Comp\nref={ref}\ndata-sidebar="menu-sub-button"\ndata-size={size}\ndata-active={isActive}\nclassName={cn(\n"flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 text-sidebar-foreground outline-none ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-sidebar-accent-foreground",\n"data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground",\nsize === "sm" && "text-xs",\nsize === "md" && "text-sm",\n"group-data-[collapsible=icon]:hidden",\nclassName\n)}\n{...props}\n/>\n)\n})\nSidebarMenuSubButton.displayName = "SidebarMenuSubButton"\n\nexport {\nSidebar,\nSidebarContent,\nSidebarFooter,\nSidebarGroup,\nSidebarGroupAction,\nSidebarGroupContent,\nSidebarGroupLabel,\nSidebarHeader,\nSidebarInput,\nSidebarInset,\nSidebarMenu,\nSidebarMenuAction,\nSidebarMenuBadge,\nSidebarMenuButton,\nSidebarMenuItem,\nSidebarMenuSub,\nSidebarMenuSubButton,\nSidebarMenuSubItem,\nSidebarProvider,\nSidebarSeparator,\nSidebarTrigger,\nSidebarRail,\nuseSidebar,\n}\n',
      bContent:
        'SidebarMenuBadge.displayName = "SidebarMenuBadge"\n\nconst SidebarMenuSkeleton = ({\nref,\nclassName,\nshowIcon = false,\n...props\n}: React.ComponentProps<"div"> & {\nshowIcon?: boolean\n}) => {\n// Random width between 50 to 90%.\nconst width = React.useMemo(() => {\nreturn `${Math.floor(Math.random() * 40) + 50}%`\n}, [])\n\nreturn (\n<div\nref={ref}\ndata-sidebar="menu-skeleton"\nclassName={cn("flex h-8 items-center gap-2 rounded-md px-2", className)}\n{...props}\n>\n{showIcon && <Skeleton className="size-4 rounded-md" data-sidebar="menu-skeleton-icon" />}\n<Skeleton\nclassName="h-4 max-w-[--skeleton-width] flex-1"\ndata-sidebar="menu-skeleton-text"\nstyle={\n{\n"--skeleton-width": width,\n} as React.CSSProperties\n}\n/>\n</div>\n)\n}\nSidebarMenuSkeleton.displayName = "SidebarMenuSkeleton"\n\nconst SidebarMenuSub = ({ ref, className, ...props }: React.ComponentProps<"ul">) => (\n<ul\nref={ref}\ndata-sidebar="menu-sub"\nclassName={cn(\n"mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l border-sidebar-border px-2.5 py-0.5",\n"group-data-[collapsible=icon]:hidden",\nclassName,\n)}\n{...props}\n/>\n)\nSidebarMenuSub.displayName = "SidebarMenuSub"\n\nconst SidebarMenuSubItem = ({ ref, ...props }: React.ComponentProps<"li">) => (\n<li ref={ref} {...props} />\n)\nSidebarMenuSubItem.displayName = "SidebarMenuSubItem"\n\nconst SidebarMenuSubButton = ({\nref,\nasChild = false,\nsize = "md",\nisActive,\nclassName,\n...props\n}: React.ComponentProps<"a"> & {\nasChild?: boolean\nsize?: "sm" | "md"\nisActive?: boolean\n}) => {\nconst Comp = asChild ? Slot : "a"\n\nreturn (\n<Comp\nref={ref}\ndata-sidebar="menu-sub-button"\ndata-size={size}\ndata-active={isActive}\nclassName={cn(\n"flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 text-sidebar-foreground outline-none ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-sidebar-accent-foreground",\n"data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground",\nsize === "sm" && "text-sm",\nsize === "md" && "text-sm",\n"group-data-[collapsible=icon]:hidden",\nclassName,\n)}\n{...props}\n/>\n)\n}\nSidebarMenuSubButton.displayName = "SidebarMenuSubButton"\n\nexport {\nSidebar,\nSidebarContent,\nSidebarFooter,\nSidebarGroup,\nSidebarGroupAction,\nSidebarGroupContent,\nSidebarGroupLabel,\nSidebarHeader,\nSidebarInput,\nSidebarInset,\nSidebarMenu,\nSidebarMenuAction,\nSidebarMenuBadge,\nSidebarMenuButton,\nSidebarMenuItem,\nSidebarMenuSkeleton,\nSidebarMenuSub,\nSidebarMenuSubButton,\nSidebarMenuSubItem,\nSidebarProvider,\nSidebarRail,\nSidebarSeparator,\nSidebarTrigger,\nuseSidebar,\n}\n',
    }

    const diff = diffTokens({
      a: tokenize({
        content: aContent,
        language: "typescript",
      }),
      b: tokenize({
        content: bContent,
        language: "typescript",
      }),
    })

    const result = diffArrayToString(diff, { omit: ["insert", "delete"] })
    expect(result).toContain("export {")
  })
})

describe("preserves quotes", () => {
  it("should preserve quotes", async () => {
    const { aContent, bContent } = {
      aContent: '"use client"\n\nimport * as React from "react"',
      bContent:
        'import { PanelLeft } from "lucide-react"\nimport * as React from "react"',
    }

    const diff = diffTokens({
      a: tokenize({
        content: aContent,
        language: "typescript",
      }),
      b: tokenize({
        content: bContent,
        language: "typescript",
      }),
    })

    const result = diffArrayToString(diff, {
      omit: ["equal", "insert"],
      deleteTagClose: "",
      deleteTagOpen: "",
    }).trim()
    // the space is marked equal, so won't show up in this test where we omit equal
    expect(result).toMatchInlineSnapshot(`""useclient""`)
  })
})

describe("Unified Diff Format", () => {
  it("should parse unified diff format", () => {
    const unifiedDiff = `"@@ -4,8 +4,8 @@
   "sideEffects": false,
   "license": "MIT",
   "epic-stack": {
-    "head": "92f9b03d316381b0bea1a109bc6e6ce1363d1852",
-    "date": "2024-12-20T13:17:31Z"
+    "head": "f7d16453a46cf61005f737fe3414a8a94a45c9b0",
+    "date": "2025-01-04T13:40:29Z"
   }`

    const operations = diffStringToArray(unifiedDiff, { unifiedDiff: true })
    expect(operations).toMatchInlineSnapshot(`
      [
        {
          "tokens": [
            {
              "end": 16,
              "start": 0,
              "value": ""@@ -4,8 +4,8 @@
      ",
            },
          ],
          "type": "equal",
        },
        {
          "tokens": [
            {
              "end": 41,
              "start": 17,
              "value": "   "sideEffects": false,
      ",
            },
          ],
          "type": "equal",
        },
        {
          "tokens": [
            {
              "end": 62,
              "start": 42,
              "value": "   "license": "MIT",
      ",
            },
          ],
          "type": "equal",
        },
        {
          "tokens": [
            {
              "end": 81,
              "start": 63,
              "value": "   "epic-stack": {
      ",
            },
          ],
          "type": "equal",
        },
        {
          "tokens": [
            {
              "end": 138,
              "start": 82,
              "value": "    "head": "92f9b03d316381b0bea1a109bc6e6ce1363d1852",
      ",
            },
          ],
          "type": "delete",
        },
        {
          "tokens": [
            {
              "end": 174,
              "start": 139,
              "value": "    "date": "2024-12-20T13:17:31Z"
      ",
            },
          ],
          "type": "delete",
        },
        {
          "tokens": [
            {
              "end": 231,
              "start": 175,
              "value": "    "head": "f7d16453a46cf61005f737fe3414a8a94a45c9b0",
      ",
            },
          ],
          "type": "insert",
        },
        {
          "tokens": [
            {
              "end": 267,
              "start": 232,
              "value": "    "date": "2025-01-04T13:40:29Z"
      ",
            },
          ],
          "type": "insert",
        },
        {
          "tokens": [
            {
              "end": 272,
              "start": 268,
              "value": "   }
      ",
            },
          ],
          "type": "equal",
        },
      ]
    `)
  })
})
