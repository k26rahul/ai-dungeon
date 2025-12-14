import { marked } from 'marked';
import DOMPurify from 'dompurify';

export function renderMarkdownToHtml(md) {
  const rawHtml = marked.parse(md);
  return DOMPurify.sanitize(rawHtml);
}
