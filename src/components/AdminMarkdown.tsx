import { marked } from 'marked'

/** Renders trusted (self-authored) markdown. Not for user input. */
export default function AdminMarkdown({ markdown }: { markdown: string }) {
  const html = marked.parse(markdown, { async: false }) as string
  return <div className="admin-md" dangerouslySetInnerHTML={{ __html: html }} />
}
