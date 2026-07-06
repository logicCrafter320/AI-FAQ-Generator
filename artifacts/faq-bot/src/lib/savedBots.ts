const STORAGE_KEY = "faqbot_saved_bots";

export function getSavedBotIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export function addSavedBotId(id: string): void {
  try {
    const existing = getSavedBotIds();
    if (existing.includes(id)) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify([id, ...existing]));
  } catch {
    // localStorage unavailable, ignore
  }
}

export function removeSavedBotId(id: string): void {
  try {
    const existing = getSavedBotIds();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing.filter((existingId) => existingId !== id)));
  } catch {
    // localStorage unavailable, ignore
  }
}
