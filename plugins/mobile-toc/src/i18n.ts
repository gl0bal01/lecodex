// Quartz v5 keeps translations inside each plugin. This component needs exactly
// one string, so it carries its own table instead of depending on the
// table-of-contents plugin's internals.
const TITLES: Record<string, string> = {
  "en-US": "Table of Contents",
  "fr-FR": "Table des matières",
  "de-DE": "Inhaltsverzeichnis",
  "es-ES": "Tabla de contenidos",
}

export function tocTitle(locale?: string): string {
  if (!locale) return TITLES["en-US"]
  return TITLES[locale] ?? TITLES[locale.split("-")[0]] ?? TITLES["en-US"]
}
