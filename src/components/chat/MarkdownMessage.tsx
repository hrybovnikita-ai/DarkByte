"use client";

import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import hljs from "highlight.js/lib/core";
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import python from "highlight.js/lib/languages/python";
import bash from "highlight.js/lib/languages/bash";
import json from "highlight.js/lib/languages/json";
import "highlight.js/styles/github-dark.css";

hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("python", python);
hljs.registerLanguage("bash", bash);
hljs.registerLanguage("json", json);

function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);
  const highlighted = useMemo(() => {
    try {
      if (language && hljs.getLanguage(language)) return hljs.highlight(code, { language }).value;
      return hljs.highlightAuto(code).value;
    } catch {
      return code;
    }
  }, [code, language]);
  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch { /* ignore */ }
  }
  return (
    <div className="chat-code-block">
      <div className="chat-code-toolbar">
        <span className="text-xs text-zinc-500">{language || "code"}</span>
        <button type="button" onClick={() => void copy()} className="text-xs text-red-400 hover:text-red-300">
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="chat-code-pre"><code dangerouslySetInnerHTML={{ __html: highlighted }} /></pre>
    </div>
  );
}

export default function MarkdownMessage({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        pre({ children }) {
          return <>{children}</>;
        },
        code({ className, children }) {
          const code = String(children).replace(/\n$/, "");
          const language = /language-(\w+)/.exec(className ?? "")?.[1] ?? "";
          if (!className) {
            return <code className="chat-inline-code">{children}</code>;
          }
          return <CodeBlock language={language} code={code} />;
        },
        p({ children }) {
          return <p className="mb-3 leading-relaxed last:mb-0">{children}</p>;
        },
        ul({ children }) {
          return <ul className="mb-3 list-disc space-y-1 pl-5">{children}</ul>;
        },
        ol({ children }) {
          return <ol className="mb-3 list-decimal space-y-1 pl-5">{children}</ol>;
        },
        a({ href, children }) {
          return (
            <a href={href} className="text-red-400 underline underline-offset-2" target="_blank" rel="noreferrer">
              {children}
            </a>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}