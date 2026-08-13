import { openUrl } from '@tauri-apps/plugin-opener';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { cn } from '@/lib/utils';

type ReleaseNotesMarkdownProps = {
  children: string;
};

function isExternalUrl(url: string | undefined): url is string {
  return Boolean(url && /^(https?:|mailto:)/i.test(url));
}

function withoutMarkdownNode<Props extends { node?: unknown }>(props: Props) {
  const { node, ...elementProps } = props;
  void node;
  return elementProps;
}

export function ReleaseNotesMarkdown({ children }: ReleaseNotesMarkdownProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      skipHtml
      components={{
        h1: ({ className, ...props }) => (
          <h1
            className={cn('mt-5 mb-2 text-base font-semibold text-foreground', className)}
            {...withoutMarkdownNode(props)}
          />
        ),
        h2: ({ className, ...props }) => (
          <h2
            className={cn('mt-5 mb-2 text-sm font-semibold text-foreground', className)}
            {...withoutMarkdownNode(props)}
          />
        ),
        h3: ({ className, ...props }) => (
          <h3
            className={cn('mt-4 mb-2 text-sm font-medium text-foreground', className)}
            {...withoutMarkdownNode(props)}
          />
        ),
        p: ({ className, ...props }) => (
          <p
            className={cn('my-2 leading-6 text-muted-foreground', className)}
            {...withoutMarkdownNode(props)}
          />
        ),
        ul: ({ className, ...props }) => (
          <ul
            className={cn('my-2 list-disc space-y-1 pl-5', className)}
            {...withoutMarkdownNode(props)}
          />
        ),
        ol: ({ className, ...props }) => (
          <ol
            className={cn('my-2 list-decimal space-y-1 pl-5', className)}
            {...withoutMarkdownNode(props)}
          />
        ),
        li: ({ className, ...props }) => (
          <li
            className={cn('leading-6 text-muted-foreground marker:text-primary', className)}
            {...withoutMarkdownNode(props)}
          />
        ),
        blockquote: ({ className, ...props }) => (
          <blockquote
            className={cn(
              'my-3 border-l-2 border-primary/50 pl-3 italic text-muted-foreground',
              className
            )}
            {...withoutMarkdownNode(props)}
          />
        ),
        a: ({ href, className, onClick, ...props }) => {
          const externalUrl = isExternalUrl(href) ? href : undefined;

          return (
            <a
              href={externalUrl}
              className={cn(
                'font-medium text-primary underline decoration-primary/40 underline-offset-2',
                externalUrl && 'cursor-pointer hover:decoration-primary',
                className
              )}
              onClick={(event) => {
                onClick?.(event);
                event.preventDefault();
                if (externalUrl) {
                  void openUrl(externalUrl);
                }
              }}
              {...withoutMarkdownNode(props)}
            />
          );
        },
        code: ({ className, ...props }) => (
          <code
            className={cn(
              'rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground',
              className
            )}
            {...withoutMarkdownNode(props)}
          />
        ),
        pre: ({ className, ...props }) => (
          <pre
            className={cn(
              'my-3 max-w-full overflow-x-auto rounded-md border bg-muted p-3 text-xs leading-5 [&>code]:bg-transparent [&>code]:p-0',
              className
            )}
            {...withoutMarkdownNode(props)}
          />
        ),
        hr: ({ className, ...props }) => (
          <hr className={cn('my-4 border-border', className)} {...withoutMarkdownNode(props)} />
        ),
        table: ({ className, ...props }) => (
          <div className="my-3 max-w-full overflow-x-auto rounded-md border">
            <table
              className={cn('w-full border-collapse text-left text-xs', className)}
              {...withoutMarkdownNode(props)}
            />
          </div>
        ),
        th: ({ className, ...props }) => (
          <th
            className={cn('border-b bg-muted px-3 py-2 font-medium text-foreground', className)}
            {...withoutMarkdownNode(props)}
          />
        ),
        td: ({ className, ...props }) => (
          <td
            className={cn('border-b px-3 py-2 text-muted-foreground last:border-b-0', className)}
            {...withoutMarkdownNode(props)}
          />
        ),
        img: ({ src, alt }) =>
          isExternalUrl(src) && src.startsWith('http') ? (
            <img
              src={src}
              alt={alt ?? ''}
              loading="lazy"
              className="my-3 max-h-64 max-w-full rounded-md border object-contain"
            />
          ) : alt ? (
            <span>{alt}</span>
          ) : null,
      }}
    >
      {children}
    </ReactMarkdown>
  );
}
