/**
 * Film metadata lookup is deferred until you provide a key.
 * Put VITE_TMDB_API_KEY in `.env` later — do not invent partnerships or fake results.
 */
export function isFilmLookupConfigured() {
  return Boolean(import.meta.env.VITE_TMDB_API_KEY)
}

export async function lookupFilmByTitle(_title: string): Promise<null> {
  if (!isFilmLookupConfigured()) return null
  // Wired later when a key exists. Never invent cast/credits.
  return null
}
