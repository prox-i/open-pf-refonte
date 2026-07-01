'use client'

import { useEditor, EditorContent, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import LinkExtension from '@tiptap/extension-link'
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Link2,
  Link2Off,
  Undo2,
  Redo2,
} from 'lucide-react'

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
}

interface ToolButton {
  key: string
  label: string
  icon: React.ReactNode
  isActive?: (e: Editor) => boolean
  run: (e: Editor) => void
}

const BUTTONS: ToolButton[] = [
  {
    key: 'bold',
    label: 'Gras',
    icon: <Bold size={16} />,
    isActive: (e) => e.isActive('bold'),
    run: (e) => e.chain().focus().toggleBold().run(),
  },
  {
    key: 'italic',
    label: 'Italique',
    icon: <Italic size={16} />,
    isActive: (e) => e.isActive('italic'),
    run: (e) => e.chain().focus().toggleItalic().run(),
  },
  {
    key: 'h2',
    label: 'Titre',
    icon: <Heading2 size={16} />,
    isActive: (e) => e.isActive('heading', { level: 2 }),
    run: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    key: 'h3',
    label: 'Sous-titre',
    icon: <Heading3 size={16} />,
    isActive: (e) => e.isActive('heading', { level: 3 }),
    run: (e) => e.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    key: 'bullet',
    label: 'Liste à puces',
    icon: <List size={16} />,
    isActive: (e) => e.isActive('bulletList'),
    run: (e) => e.chain().focus().toggleBulletList().run(),
  },
  {
    key: 'ordered',
    label: 'Liste numérotée',
    icon: <ListOrdered size={16} />,
    isActive: (e) => e.isActive('orderedList'),
    run: (e) => e.chain().focus().toggleOrderedList().run(),
  },
  {
    key: 'link',
    label: 'Ajouter un lien',
    icon: <Link2 size={16} />,
    isActive: (e) => e.isActive('link'),
    run: (e) => {
      const previous = e.getAttributes('link')['href'] as string | undefined
      const url = window.prompt('Adresse du lien (https://…)', previous ?? 'https://')
      if (url === null) return
      if (url === '') {
        e.chain().focus().extendMarkRange('link').unsetLink().run()
        return
      }
      e.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    },
  },
  {
    key: 'unlink',
    label: 'Retirer le lien',
    icon: <Link2Off size={16} />,
    run: (e) => e.chain().focus().unsetLink().run(),
  },
  {
    key: 'undo',
    label: 'Annuler',
    icon: <Undo2 size={16} />,
    run: (e) => e.chain().focus().undo().run(),
  },
  {
    key: 'redo',
    label: 'Rétablir',
    icon: <Redo2 size={16} />,
    run: (e) => e.chain().focus().redo().run(),
  },
]

export function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: { rel: 'noopener noreferrer' },
      }),
    ],
    content: value || '',
    immediatelyRender: false, // évite les erreurs d'hydratation SSR (Next)
    onUpdate: ({ editor }) => onChange(editor.isEmpty ? '' : editor.getHTML()),
  })

  if (!editor) return null

  return (
    <div className="rte">
      <div className="rte-toolbar" role="toolbar" aria-label="Mise en forme">
        {BUTTONS.map((b) => (
          <button
            key={b.key}
            type="button"
            className={`rte-btn${b.isActive?.(editor) ? ' is-active' : ''}`}
            title={b.label}
            aria-label={b.label}
            onClick={() => b.run(editor)}
          >
            {b.icon}
          </button>
        ))}
      </div>
      <EditorContent editor={editor} className="rte-content" />
    </div>
  )
}
