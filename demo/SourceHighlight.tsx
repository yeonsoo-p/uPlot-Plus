import { useMemo, useState, useCallback } from 'react';

const KEYWORDS = new Set([
  'import', 'export', 'default', 'from', 'const', 'let', 'var', 'function',
  'return', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break',
  'continue', 'new', 'typeof', 'instanceof', 'in', 'of', 'as', 'type',
  'interface', 'extends', 'implements', 'class', 'this', 'super', 'null',
  'undefined', 'true', 'false', 'void', 'never', 'readonly', 'enum',
  'async', 'await', 'yield', 'throw', 'try', 'catch', 'finally',
]);

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function highlightTsx(source: string): string {
  const lines = source.split('\n');
  return lines.map(line => highlightLine(line)).join('\n');
}

function highlightLine(line: string): string {
  let result = '';
  let i = 0;

  while (i < line.length) {
    // Line comment
    if (line[i] === '/' && line[i + 1] === '/') {
      result += `<span class="hl-comment">${escapeHtml(line.slice(i))}</span>`;
      return result;
    }

    // String (single or double quote)
    if (line[i] === "'" || line[i] === '"') {
      const quote = line[i];
      let j = i + 1;
      while (j < line.length && line[j] !== quote) {
        if (line[j] === '\\') j++;
        j++;
      }
      j++; // include closing quote
      result += `<span class="hl-string">${escapeHtml(line.slice(i, j))}</span>`;
      i = j;
      continue;
    }

    // Template literal
    if (line[i] === '`') {
      let j = i + 1;
      while (j < line.length && line[j] !== '`') {
        if (line[j] === '\\') j++;
        j++;
      }
      j++;
      result += `<span class="hl-string">${escapeHtml(line.slice(i, j))}</span>`;
      i = j;
      continue;
    }

    // Number
    if (/\d/.test(line[i]) && (i === 0 || /[\s,(\[{=:+\-*/<>!&|]/.test(line[i - 1]))) {
      let j = i;
      while (j < line.length && /[\d._eExXa-fA-F]/.test(line[j])) j++;
      result += `<span class="hl-number">${escapeHtml(line.slice(i, j))}</span>`;
      i = j;
      continue;
    }

    // JSX tag (opening/closing)
    if (line[i] === '<' && (line[i + 1] === '/' || /[A-Z]/.test(line[i + 1]))) {
      let j = i + 1;
      if (line[j] === '/') j++;
      const start = j;
      while (j < line.length && /[\w.]/.test(line[j])) j++;
      const tagName = line.slice(start, j);
      if (tagName.length > 0) {
        result += `<span class="hl-tag">&lt;${line[i + 1] === '/' ? '/' : ''}${escapeHtml(tagName)}</span>`;
        i = j;
        continue;
      }
    }

    // Word (keyword or identifier)
    if (/[a-zA-Z_$]/.test(line[i])) {
      let j = i;
      while (j < line.length && /[\w$]/.test(line[j])) j++;
      const word = line.slice(i, j);
      if (KEYWORDS.has(word)) {
        result += `<span class="hl-keyword">${escapeHtml(word)}</span>`;
      } else {
        result += escapeHtml(word);
      }
      i = j;
      continue;
    }

    // Closing JSX > or />
    if ((line[i] === '/' && line[i + 1] === '>') || (line[i] === '>' && i > 0)) {
      result += `<span class="hl-tag">${escapeHtml(line[i] === '/' ? '/>' : '>')}</span>`;
      i += line[i] === '/' ? 2 : 1;
      continue;
    }

    result += escapeHtml(line[i]);
    i++;
  }

  return result;
}

export function SourceHighlight({ source }: { source: string }) {
  const html = useMemo(() => highlightTsx(source), [source]);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(source).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [source]);

  return (
    <div className="demo-source">
      <div className="demo-source-header">
        Source
        <button className="demo-source-copy" onClick={handleCopy}>
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="demo-source-code">
        <code dangerouslySetInnerHTML={{ __html: html }} />
      </pre>
    </div>
  );
}
