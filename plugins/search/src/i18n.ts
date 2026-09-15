export interface Strings {
  title: string
  placeholder: string
  noResults: string
}

const STRINGS: Record<string, Strings> = {
  "en-US": { title: "Search", placeholder: "Search for something", noResults: "No results for" },
  "fr-FR": {
    title: "Recherche",
    placeholder: "Rechercher quelque chose",
    noResults: "Aucun résultat pour",
  },
  "de-DE": { title: "Suche", placeholder: "Suche nach etwas", noResults: "Keine Ergebnisse für" },
  "es-ES": { title: "Buscar", placeholder: "Busca algo", noResults: "Sin resultados para" },
}

export function strings(locale?: string): Strings {
  if (!locale) return STRINGS["en-US"]
  return STRINGS[locale] ?? STRINGS[locale.split("-")[0]] ?? STRINGS["en-US"]
}
