import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Text } from "@/components/ui/Text";

type Props = {
  content: string;
};

export default function MarkdownViewer({ content }: Props) {
  return (
    <div className="markdown-body w-full min-h-[24px]">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || "");
            return !inline && match ? (
              <div className="my-4 rounded-md overflow-x-auto border border-border">
                <div className="bg-muted/20 px-3 py-2 text-muted-foreground font-mono border-b border-border/20 flex justify-between">
                  <Text variant="sm" as="span">
                    {match[1]}
                  </Text>
                </div>
                <SyntaxHighlighter
                  style={vscDarkPlus}
                  language={match[1]}
                  PreTag="div"
                  customStyle={{ margin: 0, padding: "1rem" }}
                  {...props}
                >
                  {String(children).replace(/\n$/, "")}
                </SyntaxHighlighter>
              </div>
            ) : (
              <code
                className="bg-muted/20 text-pink-600 px-1.5 py-0.5 rounded font-mono text-xs border border-border/20"
                {...props}
              >
                {children}
              </code>
            );
          },
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-4 border border-border rounded-lg custom-scrollbar">
              <table
                className="min-w-full divide-y divide-border text-sm"
                {...props}
              />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead className="bg-muted/60" {...props} />
          ),
          tbody: ({ node, ...props }) => (
            <tbody
              className="divide-y divide-border/60 bg-white"
              {...props}
            />
          ),
          tr: ({ node, ...props }) => <tr className="" {...props} />,
          th: ({ node, ...props }) => (
            <th
              className="px-3 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap"
              {...props}
            />
          ),
          td: ({ node, ...props }) => (
            <td
              className="px-3 py-3 text-muted-foreground whitespace-pre-wrap"
              {...props}
            />
          ),
          h1: ({ node, ...props }) => (
            <h1
              className="text-xl font-bold mt-6 mb-3 text-foreground pb-2 border-b"
              {...props}
            />
          ),
          h2: ({ node, ...props }) => (
            <h2
              className="text-lg font-bold mt-6 mb-3 text-foreground"
              {...props}
            />
          ),
          h3: ({ node, ...props }) => (
            <h3
              className="text-base font-bold mt-4 mb-2 text-foreground"
              {...props}
            />
          ),
          ul: ({ node, ...props }) => (
            <ul
              className="list-disc pl-5 my-2 space-y-1 text-foreground"
              {...props}
            />
          ),
          ol: ({ node, ...props }) => (
            <ol
              className="list-decimal pl-5 my-2 space-y-1 text-foreground"
              {...props}
            />
          ),
          li: ({ node, ...props }) => (
            <li className="pl-1" {...props} />
          ),
          p: ({ node, ...props }) => (
            <p
              className="my-2 leading-relaxed text-foreground"
              {...props}
            />
          ),
          a: ({ node, ...props }) => (
            <a
              className="text-blue-600 hover:underline cursor-pointer"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            />
          ),
          hr: ({ node, ...props }) => (
            <hr className="my-6 border-border" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

