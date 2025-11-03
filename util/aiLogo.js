const AI_LOGOS = {
  openai: "/images/gpt.png",
  gpt: "/images/gpt.png",
  chatgpt: "/images/gpt.png",
  gemini: "/images/gemini.png",
};

function getAiLogo(aiOrType, opts) {
  const fallback = (opts && opts.defaultSrc);
  const raw =
    typeof aiOrType === "string"
      ? aiOrType
      : (aiOrType && (aiOrType.model_type || aiOrType.model_name || aiOrType.model_use_name)) ||
        "";
  const t = String(raw).toLowerCase();

  if (t.includes("openai") || t.includes("chatgpt") || t.includes("gpt")) return AI_LOGOS.openai;
  if (t.includes("gemini")) return AI_LOGOS.gemini;
  return fallback;
}

module.exports = { getAiLogo, AI_LOGOS };
