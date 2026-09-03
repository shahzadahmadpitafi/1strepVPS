import type { ReactNode } from "react";

// Renders plain SMS body text with any http(s) URLs turned into real, tappable
// links — SMS itself is plain text with no markup, so feedback/tracking links
// inside message bodies need this to be clickable in admin thread views.
export function linkifyMessageBody(text: string): ReactNode[] {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = urlRegex.exec(text)) !== null) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index));
    const url = match[0];
    nodes.push(
      <a
        key={match.index}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="underline break-all hover:opacity-80"
        onClick={(e) => e.stopPropagation()}
      >
        {url}
      </a>
    );
    lastIndex = match.index + url.length;
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}
