export function extractJson<T>(text: string): T | null {
  if (!text) return null;
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = (fenced ? fenced[1] : text).trim();
  const tryParse = (s: string): T | null => {
    try {
      return JSON.parse(s) as T;
    } catch {
      return null;
    }
  };
  const direct = tryParse(candidate);
  if (direct) return direct;
  const firstBrace = candidate.search(/[[{]/);
  if (firstBrace === -1) return null;
  const lastCurly = candidate.lastIndexOf("}");
  const lastSquare = candidate.lastIndexOf("]");
  const end = Math.max(lastCurly, lastSquare);
  if (end <= firstBrace) return null;
  return tryParse(candidate.slice(firstBrace, end + 1));
}
