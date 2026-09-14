/** Estrae il codice stanza da un link tipo /join/ABC123, se presente. */
export function parseJoinCodeFromUrl(): string | null {
  const match = window.location.pathname.match(/\/join\/([A-Za-z0-9]{4,10})/);
  return match ? match[1].toUpperCase() : null;
}

export function buildJoinUrl(code: string): string {
  return `${window.location.origin}/join/${code}`;
}
