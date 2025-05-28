



export interface ParsedLatex {
  title: string
  order?:number
  description?: string
  category?: string
  tags?: string[]
  date?: string
  readTime?: string
  content: LatexContent[]
}

export type LatexContent = 
  | { type: 'heading'; level: number; content: string }
  | { type: 'paragraph'; content: string }
  | { type: 'math'; content: string }
  | { type: 'code'; language: string; content: string }
  | { type: 'list'; ordered: boolean; items: string[] }


interface Metadata {
  description?: string
  category?: string
  order?:number
  tags?: string[]
  date?: string
} 

export function parseLatex(latexContent: string): ParsedLatex {
  const title = extractTitle(latexContent) || "Untitled Tutorial"
  const metadata = extractMetadata(latexContent)
  const content = extractContent(latexContent)

  return {
    title,
    description: metadata.description,
    order:metadata.order,
    category: metadata.category,
    tags: metadata.tags,
    date: metadata.date,
    readTime: calculateReadTime(latexContent),
    content,
  }
}

function extractTitle(latexContent: string): string | null {
  const titleMatch = latexContent.match(/\\title\{([^}]+)\}/)
  return titleMatch ? titleMatch[1] : null
}

function extractMetadata(latexContent: string): Metadata {
  const dateMatch = latexContent.match(/\\date\{([^}]+)\}/)
  const descriptionMatch = latexContent.match(/\\begin\{abstract\}([\s\S]*?)\\end\{abstract\}/)
  const orderMatch = latexContent.match(/\\order\{([^}]+)\}/);

  return {
    description: descriptionMatch ? descriptionMatch[1].trim() : undefined,
    date: dateMatch ? dateMatch[1] : undefined,
    order: orderMatch ? parseInt(orderMatch[1]) : undefined, // Convert to number
    tags: extractTags(latexContent),
    category: extractCategory(latexContent),
  }
}

function extractTags(latexContent: string): string[] {
  const tagsMatch = latexContent.match(/\\keywords\{([^}]+)\}/)
  return tagsMatch ? tagsMatch[1].split(",").map((tag) => tag.trim()) : []
}

function extractCategory(latexContent: string): string | undefined {
  const categoryMatch = latexContent.match(/\\category\{([^}]+)\}/)
  return categoryMatch ? categoryMatch[1] : undefined
}

function calculateReadTime(content: string): string {
  const wordCount = content.split(/\s+/).length
  const minutes = Math.ceil(wordCount / 200)
  return `${minutes} min read`
}

function extractContent(latexContent: string): LatexContent[] {
  const content: LatexContent[] = []
  extractSections(latexContent, content)

  if (content.length === 0) {
    content.push({
      type: "paragraph",
      content: "No content could be extracted from this LaTeX document.",
    })
  }

  return content
}

function extractSections(latexContent: string, content: LatexContent[]): void {
  const sectionRegex =
    /\\(section|subsection|subsubsection)\{([^}]+)\}([\s\S]*?)(?=\\(?:section|subsection|subsubsection)\{|\\end\{document\}|$)/g
  let match

  while ((match = sectionRegex.exec(latexContent)) !== null) {
    const sectionType = match[1]
    const sectionTitle = match[2]
    const sectionContent = match[3].trim()

    let level = 1
    if (sectionType === "subsection") level = 2
    else if (sectionType === "subsubsection") level = 3

    content.push({
      type: "heading",
      level,
      content: sectionTitle,
    })

    processSectionContent(sectionContent, content)
  }

  if (content.length === 0) {
    const bodyMatch = latexContent.match(/\\begin\{document\}([\s\S]*?)\\end\{document\}/)
    if (bodyMatch) {
      processSectionContent(bodyMatch[1], content)
    }
  }
}

function processSectionContent(content: string, result: LatexContent[]): void {
  const paragraphs = content.split(/\n\s*\n/)

  for (const paragraph of paragraphs) {
    const trimmedParagraph = paragraph.trim()
    if (!trimmedParagraph) continue

    if (
      trimmedParagraph.startsWith("\\begin{equation}") ||
      trimmedParagraph.startsWith("\\begin{align}") ||
      trimmedParagraph.startsWith("\\[") ||
      trimmedParagraph.startsWith("$$")
    ) {
      extractMathContent(trimmedParagraph, result)
      continue
    }

    if (
      trimmedParagraph.startsWith("\\begin{verbatim}") ||
      trimmedParagraph.startsWith("\\begin{lstlisting}") ||
      trimmedParagraph.startsWith("\\begin{minted}")
    ) {
      extractCodeContent(trimmedParagraph, result)
      continue
    }

    if (trimmedParagraph.startsWith("\\begin{itemize}") || trimmedParagraph.startsWith("\\begin{enumerate}")) {
      extractListContent(trimmedParagraph, result)
      continue
    }

    result.push({
      type: "paragraph",
      content: cleanLatexText(trimmedParagraph),
    })
  }
}

function extractMathContent(content: string, result: LatexContent[]): void {
  let mathContent = ""

  if (content.includes("\\begin{equation}")) {
    const match = content.match(/\\begin\{equation\}([\s\S]*?)\\end\{equation\}/)
    mathContent = match?.[1].trim() ?? ""
  } else if (content.includes("\\begin{align}")) {
    const match = content.match(/\\begin\{align\}([\s\S]*?)\\end\{align\}/)
    mathContent = match?.[1].trim() ?? ""
  } else if (content.includes("\\[")) {
    const match = content.match(/\\\[([\s\S]*?)\\\]/)
    mathContent = match?.[1].trim() ?? ""
  } else if (content.includes("$$")) {
    const match = content.match(/\$\$([\s\S]*?)\$\$/)
    mathContent = match?.[1].trim() ?? ""
  }

  if (mathContent) {
    result.push({
      type: "math",
      content: mathContent,
    })
  }
}

function extractCodeContent(content: string, result: LatexContent[]): void {
  let codeContent = ""
  let language = "text"

  if (content.includes("\\begin{verbatim}")) {
    const match = content.match(/\\begin\{verbatim\}([\s\S]*?)\\end\{verbatim\}/)
    codeContent = match?.[1].trim() ?? ""
  } else if (content.includes("\\begin{lstlisting}")) {
    const match = content.match(/\\begin\{lstlisting\}(?:\[([^\]]*)\])?([\s\S]*?)\\end\{lstlisting\}/)
    if (match) {
      codeContent = match[2].trim()
      const languageMatch = match[1]?.match(/language=(\w+)/)
      if (languageMatch) language = languageMatch[1]
    }
  } else if (content.includes("\\begin{minted}")) {
    const match = content.match(/\\begin\{minted\}\{([^}]*)\}([\s\S]*?)\\end\{minted\}/)
    if (match) {
      language = match[1]
      codeContent = match[2].trim()
    }
  }

  if (codeContent) {
    result.push({
      type: "code",
      language,
      content: codeContent,
    })
  }
}

function extractListContent(content: string, result: LatexContent[]): void {
  const isOrdered = content.includes("\\begin{enumerate}")
  const listItems: string[] = []
  const itemRegex = /\\item\s+([\s\S]*?)(?=\\item|\\end\{(?:itemize|enumerate)\})/g
  let match

  while ((match = itemRegex.exec(content)) !== null) {
    listItems.push(cleanLatexText(match[1].trim()))
  }

  if (listItems.length > 0) {
    result.push({
      type: "list",
      ordered: isOrdered,
      items: listItems,
    })
  }
}

function cleanLatexText(text: string): string {

  // Clean up LaTeX commands and formatting
  // This is a very simplified version - a real implementation would be more comprehensive

  // Replace common LaTeX commands with HTML equivalents
  let cleaned = text
    .replace(/\\textbf\{([^}]+)\}/g, "<strong>$1</strong>") // Bold
    .replace(/\\texttt\{([^}]+)\}/g, "<em>$1</em>") // Italic
    .replace(/\\emph\{([^}]+)\}/g, "<em>$1</em>") // Emphasis
    .replace(/\\underline\{([^}]+)\}/g, "<u>$1</u>") // Underline
    .replace(/\\cite\{([^}]+)\}/g, "[Citation: $1]") // Citations
    .replace(/\\ref\{([^}]+)\}/g, "[Ref: $1]") // References
    .replace(/\\url\{([^}]+)\}/g, "<a href='$1'>$1</a>") // URLs
    .replace(/\\href\{([^}]+)\}\{([^}]+)\}/g, "<a href='$1'>$2</a>") // Hyperlinks
    .replace(/\\footnote\{([^}]+)\}/g, "") // Remove footnotes for now
    .replace(/\\\\/, "<br>") // Line breaks
    .replace(/~/g, " ") // Non-breaking spaces
    .replace(/\\%/g, "%") // Percent sign
    .replace(/\\&/g, "&") // Ampersand
    .replace(/\\_/g, "_") // Underscore
    .replace(/\\#/g, "#") // Hash
    .replace(/\\{/g, "{") // Opening brace
    .replace(/\\}/g, "}") // Closing brace
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>") // Markdown bold

  // Remove any remaining LaTeX commands
  cleaned = cleaned.replace(/\\[a-zA-Z]+(\{[^}]*\})?/g, "")

  return cleaned.trim()
}

