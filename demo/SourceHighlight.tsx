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
  // charAt returns '' for out-of-bounds (no undefined). Alias for cleaner indexing.
  const ch = (idx: number) => line.charAt(idx);

  while (i < line.length) {
    // Line comment
    if (ch(i) === '/' && ch(i + 1) === '/') {
      result += `<span class="hl-comment">${escapeHtml(line.slice(i))}</span>`;
      return result;
    }

    // String (single or double quote)
    if (ch(i) === "'" || ch(i) === '"') {
      const quote = ch(i);
      let j = i + 1;
      while (j < line.length && ch(j) !== quote) {
        if (ch(j) === '\\') j++;
        j++;
      }
      j++; // include closing quote
      result += `<span class="hl-string">${escapeHtml(line.slice(i, j))}</span>`;
      i = j;
      continue;
    }

    // Template literal
    if (ch(i) === '`') {
      let j = i + 1;
      while (j < line.length && ch(j) !== '`') {
        if (ch(j) === '\\') j++;
        j++;
      }
      j++;
      result += `<span class="hl-string">${escapeHtml(line.slice(i, j))}</span>`;
      i = j;
      continue;
    }

    // Number
    if (/\d/.test(ch(i)) && (i === 0 || /[\s,([{=:+\-*/<>!&|]/.test(ch(i - 1)))) {
      let j = i;
      while (j < line.length && /[\d._eExXa-fA-F]/.test(ch(j))) j++;
      result += `<span class="hl-number">${escapeHtml(line.slice(i, j))}</span>`;
      i = j;
      continue;
    }

    // JSX tag (opening/closing)
    if (ch(i) === '<' && (ch(i + 1) === '/' || /[A-Z]/.test(ch(i + 1)))) {
      let j = i + 1;
      if (ch(j) === '/') j++;
      const start = j;
      while (j < line.length && /[\w.]/.test(ch(j))) j++;
      const tagName = line.slice(start, j);
      if (tagName.length > 0) {
        result += `<span class="hl-tag">&lt;${ch(i + 1) === '/' ? '/' : ''}${escapeHtml(tagName)}</span>`;
        i = j;
        continue;
      }
    }

    // Word (keyword or identifier)
    if (/[a-zA-Z_$]/.test(ch(i))) {
      let j = i;
      while (j < line.length && /[\w$]/.test(ch(j))) j++;
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
    if ((ch(i) === '/' && ch(i + 1) === '>') || (ch(i) === '>' && i > 0)) {
      result += `<span class="hl-tag">${escapeHtml(ch(i) === '/' ? '/>' : '>')}</span>`;
      i += ch(i) === '/' ? 2 : 1;
      continue;
    }

    result += escapeHtml(ch(i));
    i++;
  }

  return result;
}

export function SourceHighlight({ source }: { source: string }) {
  const html = useMemo(() => highlightTsx(source), [source]);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    void navigator.clipboard.writeText(source).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [source]);

  return (
    <div className="flex-[1_1_0] min-w-75 flex flex-col rounded-md overflow-hidden bg-[#1e1e2e] max-[1200px]:max-h-100">
      <div className="flex items-center justify-between py-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-[#8899aa] bg-[#16161e] border-b border-[#2a2a3e]">
        Source
        <button
          className="bg-white/8 border border-white/10 text-[#8899aa] py-0.5 px-2.5 rounded-sm text-[11px] cursor-pointer transition-colors hover:bg-white/15 hover:text-[#ccc]"
          onClick={handleCopy}
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="thin-scrollbar flex-1 overflow-auto p-3 m-0 font-mono text-xs leading-normal text-[#cdd6f4] [tab-size:2]">
        <code dangerouslySetInnerHTML={{ __html: html }} />
      </pre>
    </div>
  );
}
