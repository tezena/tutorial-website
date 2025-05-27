import { notFound } from "next/navigation"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ChevronLeft, ChevronRight, Clock, FileText, Tag } from "lucide-react"
import { LatexRenderer } from "@/components/latex-renderer"
import { TableOfContents } from "@/components/table-of-contents"
import { getAllTutorials, getTutorialBySlug } from "@/lib/tutorials"



type Params = {
  params: {
    slug: string;
  };
};

export default async function TutorialPage({ params }: Params) {
  try {
    const { slug } = await params;
    const tutorial = await getTutorialBySlug(slug)
    const allTutorials = await getAllTutorials()

    if (!tutorial) {
      notFound()
    }

    // Find the current tutorial index
    const currentIndex = allTutorials.findIndex((t) => t.slug === slug)

    // Get previous and next tutorials
    const prevTutorial = currentIndex > 0 ? allTutorials[currentIndex - 1] : null
    const nextTutorial = currentIndex < allTutorials.length - 1 ? allTutorials[currentIndex + 1] : null

    return (
      <div className="container py-8">
        <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] lg:grid-cols-[300px_1fr] gap-8">
          <div className="hidden md:block">
            <div className="sticky top-24">
              <Card className="p-4">
                <h3 className="font-medium mb-3">Table of Contents</h3>
                <TableOfContents content={tutorial.content} />
              </Card>
            </div>
          </div>
          <div>
            <div className="mb-6">
              <Link
                href="/tutorials"
                className="text-sm flex items-center text-muted-foreground hover:text-foreground mb-4"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back to tutorials
              </Link>
              <h1 className="text-3xl font-bold tracking-tight">{tutorial.title}</h1>
              <p className="text-muted-foreground mt-2">{tutorial.description}</p>
              <div className="flex flex-wrap items-center gap-2 mt-4">
                <Badge variant="outline">{tutorial.category}</Badge>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 mr-1" />
                  {tutorial.readTime}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <FileText className="h-4 w-4 mr-1" />
                  {tutorial.date}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                <div className="flex items-center text-sm text-muted-foreground mr-2">
                  <Tag className="h-4 w-4 mr-1" />
                  Tags:
                </div>
                {tutorial.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
              <Separator className="my-6" />
            </div>

            <LatexRenderer content={tutorial.content} />

            <div className="mt-12 pt-6 border-t">
              <div className="flex justify-between">
                {prevTutorial ? (
                  <Link href={`/tutorials/${prevTutorial.slug}`} className="flex-1 mr-2">
                    <Button variant="outline" className="flex items-center gap-2 w-full justify-start">
                      <ChevronLeft className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{prevTutorial.title}</span>
                    </Button>
                  </Link>
                ) : (
                  <div className="flex-1 mr-2">
                    <Button variant="outline" className="flex items-center gap-2 w-full justify-start" disabled>
                      <ChevronLeft className="h-4 w-4 flex-shrink-0" />
                      <span>Previous Tutorial</span>
                    </Button>
                  </div>
                )}

                {nextTutorial ? (
                  <Link href={`/tutorials/${nextTutorial.slug}`} className="flex-1 ml-2">
                    <Button variant="outline" className="flex items-center gap-2 w-full justify-end">
                      <span className="truncate">{nextTutorial.title}</span>
                      <ChevronRight className="h-4 w-4 flex-shrink-0" />
                    </Button>
                  </Link>
                ) : (
                  <div className="flex-1 ml-2">
                    <Button variant="outline" className="flex items-center gap-2 w-full justify-end" disabled>
                      <span>Next Tutorial</span>
                      <ChevronRight className="h-4 w-4 flex-shrink-0" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  } catch (error) {
     const { slug } = params;
    console.error(`Error loading tutorial ${slug}:`, error)
    notFound()
  }
}
