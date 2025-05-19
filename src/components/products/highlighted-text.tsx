import { Fragment } from 'react';

interface HighlightedTextProps {
  text: string;
  highlight: string;
}

export function HighlightedText({ text, highlight }: HighlightedTextProps) {
  if (!highlight.trim() || !text) {
    return <span>{text}</span>;
  }

  const regex = new RegExp(
    `(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`,
    'gi',
  );
  const parts = text.split(regex);

  return (
    <span>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <span
            key={`${part}-${text.indexOf(part, i)}`}
            className="bg-yellow-100 font-medium dark:bg-yellow-900"
          >
            {part}
          </span>
        ) : (
          <Fragment key={`${part}-${text.indexOf(part, i)}`}>{part}</Fragment>
        ),
      )}
    </span>
  );
}
