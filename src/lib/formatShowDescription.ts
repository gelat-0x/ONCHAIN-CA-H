/**
 * Turn the YouTube / X episode blurb into readable blocks without inventing content.
 * Splits on the show's ¤ section markers and keeps the original wording.
 */
export function formatShowDescription(raw: string): string {
  let text = raw.replace(/\s+/g, ' ').trim();
  if (!text) return '';

  text = text
    .replace(/\s*(?:MORE☎️|New to streaming)[\s\S]*$/i, '')
    .replace(/\s*https?:\/\/streamyard\.com\S+/gi, '')
    .trim();

  if (!text.includes('¤')) return ensureSentence(text);

  const parts = text.split(/\s*¤\s*/).map((part) => part.trim()).filter(Boolean);
  const [intro, ...sections] = parts;

  const formattedSections = sections.map((section) => {
    const colon = section.search(/:/);
    if (colon > 0 && colon < 90) {
      const title = section.slice(0, colon).trim();
      const body = ensureSentence(section.slice(colon + 1).trim());
      return body ? `¤ ${title}\n${body}` : `¤ ${title}`;
    }
    return `¤ ${ensureSentence(section)}`;
  });

  return [ensureSentence(intro), ...formattedSections].filter(Boolean).join('\n\n');
}

function ensureSentence(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (/[.!?…:]$/.test(trimmed)) return trimmed;
  return `${trimmed}.`;
}
