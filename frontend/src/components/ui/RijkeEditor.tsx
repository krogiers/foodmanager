import { useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import {
  Bold, Italic, UnderlineIcon, List, ListOrdered,
  Heading2, Heading3, Undo2, Redo2, Minus,
} from 'lucide-react'

interface Props {
  waarde: string
  onChange: (html: string) => void
  readonly?: boolean
  placeholder?: string
}

// Shared Tailwind selectors that style TipTap output identically in edit and readonly mode.
// Any style change here applies everywhere — edit mode, detail view, labels, etc.
const EDITOR_CONTENT_STYLES = `
  [&_.tiptap]:outline-none
  [&_.tiptap]:text-sm [&_.tiptap]:text-slate-800 [&_.tiptap]:leading-relaxed
  [&_.tiptap_h2]:text-base [&_.tiptap_h2]:font-semibold [&_.tiptap_h2]:text-slate-900 [&_.tiptap_h2]:mt-4 [&_.tiptap_h2]:mb-1
  [&_.tiptap_h3]:text-sm [&_.tiptap_h3]:font-semibold [&_.tiptap_h3]:text-slate-900 [&_.tiptap_h3]:mt-3 [&_.tiptap_h3]:mb-1
  [&_.tiptap_p]:my-1
  [&_.tiptap_ul]:pl-5 [&_.tiptap_ul]:list-disc [&_.tiptap_ul]:my-1
  [&_.tiptap_ol]:pl-5 [&_.tiptap_ol]:list-decimal [&_.tiptap_ol]:my-1
  [&_.tiptap_li]:my-0.5
  [&_.tiptap_hr]:border-slate-200 [&_.tiptap_hr]:my-3
  [&_.tiptap_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]
  [&_.tiptap_.is-editor-empty:first-child::before]:text-slate-400
  [&_.tiptap_.is-editor-empty:first-child::before]:float-left
  [&_.tiptap_.is-editor-empty:first-child::before]:pointer-events-none
  [&_.tiptap_.is-editor-empty:first-child::before]:h-0
`

export function RijkeEditor({ waarde, onChange, readonly = false, placeholder = 'Schrijf hier de bereidingswijze…' }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        horizontalRule: {},
      }),
      Underline,
      Placeholder.configure({ placeholder }),
    ],
    content: waarde,
    editable: !readonly,
    onUpdate: ({ editor }) => {
      if (!readonly) onChange(editor.getHTML())
    },
  })

  // Sync external value changes (e.g. navigating between records in readonly mode)
  useEffect(() => {
    if (!editor) return
    if (editor.getHTML() !== waarde) {
      editor.commands.setContent(waarde || '')
    }
  }, [waarde, editor])

  if (!editor) return null

  if (readonly) {
    return (
      <EditorContent
        editor={editor}
        className={EDITOR_CONTENT_STYLES}
      />
    )
  }

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-amber-500 focus-within:border-amber-500 transition-shadow">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-slate-200 bg-slate-50 flex-wrap">
        <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })} title="Kop 2">
          <Heading2 className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive('heading', { level: 3 })} title="Kop 3">
          <Heading3 className="h-4 w-4" />
        </ToolbarBtn>

        <Sep />

        <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')} title="Vetgedrukt (Ctrl+B)">
          <Bold className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')} title="Cursief (Ctrl+I)">
          <Italic className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive('underline')} title="Onderstreept (Ctrl+U)">
          <UnderlineIcon className="h-4 w-4" />
        </ToolbarBtn>

        <Sep />

        <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')} title="Opsomming">
          <List className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')} title="Genummerde lijst">
          <ListOrdered className="h-4 w-4" />
        </ToolbarBtn>

        <Sep />

        <ToolbarBtn onClick={() => editor.chain().focus().setHorizontalRule().run()}
          active={false} title="Scheidingslijn">
          <Minus className="h-4 w-4" />
        </ToolbarBtn>

        <div className="flex-1" />

        <ToolbarBtn onClick={() => editor.chain().focus().undo().run()}
          active={false} disabled={!editor.can().undo()} title="Ongedaan maken (Ctrl+Z)">
          <Undo2 className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().redo().run()}
          active={false} disabled={!editor.can().redo()} title="Opnieuw (Ctrl+Y)">
          <Redo2 className="h-4 w-4" />
        </ToolbarBtn>
      </div>

      {/* Editor */}
      <EditorContent
        editor={editor}
        className={`${EDITOR_CONTENT_STYLES} [&_.tiptap]:min-h-[200px] [&_.tiptap]:px-4 [&_.tiptap]:py-3`}
      />
    </div>
  )
}

function ToolbarBtn({ onClick, active, disabled, title, children }: {
  onClick: () => void
  active: boolean
  disabled?: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded transition-colors ${
        active
          ? 'bg-amber-100 text-amber-700'
          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
      } disabled:opacity-30 disabled:cursor-not-allowed`}
    >
      {children}
    </button>
  )
}

function Sep() {
  return <div className="w-px h-5 bg-slate-200 mx-1" />
}
