export function stripHtml(input: string) {
  return input
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeText(input: string) {
  return stripHtml(input).replace(/\s+/g, " ").trim();
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function words(input: string) {
  return normalizeText(input).toLowerCase().match(/[a-z0-9][a-z0-9.+-]*/g) ?? [];
}

export function escapeXml(input: string) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function escapeHtml(input: string) {
  return escapeXml(input);
}

export function forSpeech(input: string, language = "nl-NL") {
  let text = input
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\bOpenAI\b/g, "Open A I")
    .replace(/\bAI\b/g, "A I")
    .replace(/\bAPI\b/g, "A P I")
    .replace(/\bSDK\b/g, "S D K")
    .replace(/\bLLM(s)?\b/g, "L L M$1")
    .replace(/\bGPT-?5\b/gi, "G P T vijf")
    .replace(/\bGPT-?4\.?1\b/gi, "G P T vier point one")
    .replace(/\s+/g, " ")
    .trim();
  if (language.toLowerCase().startsWith("nl")) {
    text = text.replace(/\bGemini\b/g, "Dzjemini").replace(/\bGPT vijf\b/g, "G P T vijf");
  }
  return text;
}
