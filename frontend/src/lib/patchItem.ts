/** Returns a new list with the item matching `id` shallow-merged with `patch`. */
export function patchItem<T extends { id: number }>(items: readonly T[], id: number, patch: Partial<T>): T[] {
  return items.map((item) => (item.id === id ? { ...item, ...patch } : item))
}
