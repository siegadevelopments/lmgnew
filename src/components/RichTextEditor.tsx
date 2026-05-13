'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

// Move dynamic import to module level for better performance and stability
const ReactQuill = dynamic(() => import('react-quill-new'), { 
  ssr: false,
  loading: () => <div className="h-[250px] w-full bg-muted animate-pulse rounded-md border border-border" />
});

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
      ['link', 'clean']
    ],
    clipboard: {
      matchVisual: false,
    }
  };

  return (
    <div className={`rich-text-editor ${className}`}>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        placeholder={placeholder}
      />
      <style>{`
        .rich-text-editor .ql-container {
          min-height: 250px;
          font-size: 16px;
          border-bottom-left-radius: 0.5rem;
          border-bottom-right-radius: 0.5rem;
          background: hsl(var(--background));
          color: hsl(var(--foreground));
          font-family: inherit;
        }
        .rich-text-editor .ql-toolbar {
          border-top-left-radius: 0.5rem;
          border-top-right-radius: 0.5rem;
          background: hsl(var(--muted) / 0.5);
          border-color: hsl(var(--border));
        }
        .rich-text-editor .ql-container.ql-snow {
          border-color: hsl(var(--border));
        }
        .rich-text-editor .ql-editor {
          min-height: 250px;
        }
        .rich-text-editor .ql-editor.ql-blank::before {
          color: hsl(var(--muted-foreground));
          font-style: normal;
          opacity: 0.6;
        }
        .rich-text-editor .ql-snow .ql-stroke {
          stroke: hsl(var(--foreground)) !important;
          stroke-width: 2px;
        }
        .rich-text-editor .ql-snow .ql-fill {
          fill: hsl(var(--foreground)) !important;
        }
        .rich-text-editor .ql-snow .ql-picker {
          color: hsl(var(--foreground)) !important;
        }
        .rich-text-editor .ql-snow .ql-picker-options {
          background-color: hsl(var(--popover)) !important;
          color: hsl(var(--popover-foreground)) !important;
          border-color: hsl(var(--border)) !important;
        }
        .rich-text-editor .ql-toolbar button:hover .ql-stroke {
          stroke: hsl(var(--primary)) !important;
        }
        .rich-text-editor .ql-toolbar button:hover .ql-fill {
          fill: hsl(var(--primary)) !important;
        }
        .rich-text-editor .ql-toolbar button.ql-active .ql-stroke {
          stroke: hsl(var(--primary)) !important;
        }
        .rich-text-editor .ql-toolbar button.ql-active .ql-fill {
          fill: hsl(var(--primary)) !important;
        }
      `}</style>
    </div>
  );
}
