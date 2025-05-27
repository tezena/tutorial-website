"use client"

import { useEffect, useRef } from "react"
import type { JSX } from "react/jsx-runtime"
import { MathFormula } from "@/components/math-formula"
import { useSearchParams } from "next/navigation"
import { CodeEditor } from "@/components/code-editor"

interface ContentItem {
  type: string
  level?: number
  content?: string
  language?: string
  items?: string[]
  ordered?: boolean
}

interface LatexRendererProps {
  content: ContentItem[]
}

export function LatexRenderer({ content }: LatexRendererProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const searchParams = useSearchParams()

  // Initialize MathJax for the entire content
  useEffect(() => {
    if (contentRef.current && typeof window !== "undefined" && window.MathJax) {
      window.MathJax.typesetPromise([contentRef.current]).catch((err) => {
        console.error("MathJax typesetting failed:", err)
      })
    }
  }, [content])

  // Scroll to the section if hash is present
  useEffect(() => {
    // Get the hash from the URL
    const hash = window.location.hash.substring(1)

    if (hash && contentRef.current) {
      // Find the element with the matching ID
      const element = document.getElementById(hash)

      if (element) {
        // Scroll to the element with a slight delay to ensure rendering is complete
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth" })

          // Add a highlight effect
          element.classList.add("search-highlight")

          // Remove the highlight after a few seconds
          setTimeout(() => {
            element.classList.remove("search-highlight")
          }, 3000)
        }, 300)
      }
    }
  }, [searchParams])

  // Helper function to escape dollar signs in text content
  const escapeText = (text: string): string => {
    // Replace $ with the HTML entity for dollar sign
    return text.replace(/\$/g, "&#36;")
  }

  // Update the renderContent function to better handle math content
  const renderContent = (item: ContentItem, index: number) => {
    switch (item.type) {
      case "heading":
        const HeadingTag = `h${item.level}` as keyof JSX.IntrinsicElements
        const headingId = item.content?.toLowerCase().replace(/\s+/g, "-")

        return (
          <HeadingTag
            key={index}
            id={headingId}
            className={`font-bold ${
              item.level === 1 ? "text-3xl mt-8 mb-4" : item.level === 2 ? "text-2xl mt-8 mb-4" : "text-xl mt-6 mb-3"
            }`}
          >
            {escapeText(item?.content ?? "")}
          </HeadingTag>
        )

      case "paragraph":
        return <p key={index} className="my-4" dangerouslySetInnerHTML={{ __html: escapeText(item?.content ?? "") }} />

      case "math":
        // Directly use MathFormula component for math content
        return <MathFormula key={index} formula={item?.content ?? ""} display={true} className="my-4" />

      case "code":
        return (
          <div key={index} className="my-4">
            <CodeEditor
              code={item?.content?? ""}
              language={item.language || "text"}
              readOnly={false}
              showLineNumbers={true}
            />
          </div>
        )

      case "list":
        if (item.ordered) {
          return (
            <ol key={index} className="my-4 list-decimal pl-6">
              {item.items?.map((listItem, i) => (
                <li key={i} className="my-1" dangerouslySetInnerHTML={{ __html: escapeText(listItem) }} />
              ))}
            </ol>
          )
        } else {
          return (
            <ul key={index} className="my-4 list-disc pl-6">
              {item.items?.map((listItem, i) => (
                <li key={i} className="my-1" dangerouslySetInnerHTML={{ __html: escapeText(listItem) }} />
              ))}
            </ul>
          )
        }

      default:
        return null
    }
  }

  return (
    <div ref={contentRef} className="tutorial-content prose prose-slate max-w-none dark:prose-invert">
      {content.map(renderContent)}
    </div>
  )
}
