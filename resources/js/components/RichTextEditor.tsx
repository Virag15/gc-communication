import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import LinkExt from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import { cn } from '@/lib/utils';
import {
    Bold, Italic, Underline as UnderlineIcon, Heading2, Heading3, List, ListOrdered,
    Link2, AlignLeft, AlignCenter, AlignRight, Quote, Undo, Redo,
} from 'lucide-react';

interface RichTextEditorProps {
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
}

function ToolBtn({ on, run, label, children }: { on: boolean; run: () => void; label: string; children: React.ReactNode }) {
    return (
        <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={run}
            aria-label={label}
            title={label}
            className={cn('flex h-8 w-8 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground', on && 'bg-muted text-foreground')}
        >
            {children}
        </button>
    );
}

function Bar({ editor }: { editor: Editor }) {
    const setLink = () => {
        const prev = editor.getAttributes('link').href as string | undefined;
        const url = window.prompt('Link URL', prev || 'https://');
        if (url === null) return;
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    };

    const items: { icon: React.ReactNode; on: boolean; run: () => void; label: string }[] = [
        { icon: <Bold className="h-4 w-4" />, on: editor.isActive('bold'), run: () => editor.chain().focus().toggleBold().run(), label: 'Bold' },
        { icon: <Italic className="h-4 w-4" />, on: editor.isActive('italic'), run: () => editor.chain().focus().toggleItalic().run(), label: 'Italic' },
        { icon: <UnderlineIcon className="h-4 w-4" />, on: editor.isActive('underline'), run: () => editor.chain().focus().toggleUnderline().run(), label: 'Underline' },
        { icon: <Heading2 className="h-4 w-4" />, on: editor.isActive('heading', { level: 2 }), run: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), label: 'Heading 2' },
        { icon: <Heading3 className="h-4 w-4" />, on: editor.isActive('heading', { level: 3 }), run: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), label: 'Heading 3' },
        { icon: <List className="h-4 w-4" />, on: editor.isActive('bulletList'), run: () => editor.chain().focus().toggleBulletList().run(), label: 'Bullet list' },
        { icon: <ListOrdered className="h-4 w-4" />, on: editor.isActive('orderedList'), run: () => editor.chain().focus().toggleOrderedList().run(), label: 'Numbered list' },
        { icon: <Quote className="h-4 w-4" />, on: editor.isActive('blockquote'), run: () => editor.chain().focus().toggleBlockquote().run(), label: 'Quote' },
        { icon: <Link2 className="h-4 w-4" />, on: editor.isActive('link'), run: setLink, label: 'Link' },
        { icon: <AlignLeft className="h-4 w-4" />, on: editor.isActive({ textAlign: 'left' }), run: () => editor.chain().focus().setTextAlign('left').run(), label: 'Align left' },
        { icon: <AlignCenter className="h-4 w-4" />, on: editor.isActive({ textAlign: 'center' }), run: () => editor.chain().focus().setTextAlign('center').run(), label: 'Align center' },
        { icon: <AlignRight className="h-4 w-4" />, on: editor.isActive({ textAlign: 'right' }), run: () => editor.chain().focus().setTextAlign('right').run(), label: 'Align right' },
    ];

    return (
        <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/40 p-1.5">
            {items.map((it, i) => (
                <ToolBtn key={i} on={it.on} run={it.run} label={it.label}>{it.icon}</ToolBtn>
            ))}
            <div className="mx-1 h-5 w-px bg-border" />
            <ToolBtn on={false} run={() => editor.chain().focus().undo().run()} label="Undo"><Undo className="h-4 w-4" /></ToolBtn>
            <ToolBtn on={false} run={() => editor.chain().focus().redo().run()} label="Redo"><Redo className="h-4 w-4" /></ToolBtn>
        </div>
    );
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({ heading: { levels: [2, 3] } }),
            Underline,
            LinkExt.configure({ openOnClick: false, autolink: true, HTMLAttributes: { rel: 'noopener', class: 'text-blue-600 underline' } }),
            Placeholder.configure({ placeholder: placeholder || 'Write the post...' }),
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
        ],
        content: value || '',
        onUpdate: ({ editor }) => onChange(editor.getHTML()),
        editorProps: {
            attributes: {
                class: cn('prose prose-sm dark:prose-invert max-w-none min-h-[280px] px-4 py-3 focus:outline-none'),
            },
        },
    });

    if (!editor) return null;

    return (
        <div className="overflow-hidden rounded-md border border-input bg-background">
            <Bar editor={editor} />
            <EditorContent editor={editor} />
        </div>
    );
}
