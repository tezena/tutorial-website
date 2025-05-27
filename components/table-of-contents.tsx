"use client"

import { useState, useEffect } from "react"
import { ChevronRight } from "lucide-react"

interface ContentItem {
  type: string
  level?: number
  content?: string
}

interface TableOfContentsProps {
  content: ContentItem[]
}

// Utility: Slugify heading text for IDs
const slugify = (text: string): string =>
  text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-")     // Replace spaces with dashes
    .replace(/-+/g, "-")      // Remove duplicate dashes
    .replace(/^-|-$/g, "")    // Trim leading/trailing dashes

// Type guard for headings
function isHeading(
  item: ContentItem
): item is Required<Pick<ContentItem, "content" | "level">> & { type: "heading" } {
  return item.type === "heading" && typeof item.content === "string" && typeof item.level === "number"
}

export function TableOfContents({ content }: TableOfContentsProps) {
  const [activeSection, setActiveSection] = useState("")

  useEffect(() => {
    const handleScroll = () => {
      const headings = document.querySelectorAll("h1, h2, h3, h4, h5, h6")
      const scrollPosition = window.scrollY
      let currentSection = ""

      headings.forEach((heading) => {
        const top = heading.getBoundingClientRect().top + window.scrollY - 100
        if (scrollPosition >= top) {
          currentSection = heading.id
        }
      })

      if (currentSection !== activeSection) {
        setActiveSection(currentSection)
      }
    }

    window.addEventListener("scroll", handleScroll)
    handleScroll() // Set initial active section

    return () => window.removeEventListener("scroll", handleScroll)
  }, [activeSection])

  const tocItems = content
    .filter(isHeading)
    .filter((item) => item.level <= 3)
    .map((item) => ({
      id: slugify(item.content),
      title: item.content,
      level: item.level,
    }))

  return (
    <nav className="toc text-sm">
      <ul className="space-y-1">
        {tocItems.map((item) => (
          <li key={item.id} style={{ paddingLeft: `${(item.level - 1) * 0.75}rem` }}>
            <a
              href={`#${item.id}`}
              className={`flex items-center py-1 hover:text-foreground transition-colors ${
                activeSection === item.id ? "text-foreground font-medium" : "text-muted-foreground"
              }`}
              onClick={(e) => {
                e.preventDefault()
                const element = document.getElementById(item.id)
                if (element) {
                  element.scrollIntoView({ behavior: "smooth" })
                  setActiveSection(item.id)
                }
              }}
            >
              {activeSection === item.id && (
                <ChevronRight className="h-3 w-3 mr-1 flex-shrink-0" />
              )}
              <span className={activeSection === item.id ? "" : "ml-4"}>{item.title}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
