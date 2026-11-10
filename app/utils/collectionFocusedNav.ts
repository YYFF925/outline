/**
 * Height of the top collection switcher bar, in pixels.
 */
export const COLLECTION_BAR_HEIGHT = 48;

/**
 * Sidebar width applied in collection-focused navigation when the user has not
 * resized away from the default.
 */
export const FOCUSED_SIDEBAR_WIDTH = 320;

/**
 * A collection-like object used to resolve which collection the focused
 * sidebar should display.
 */
export interface FocusedCollectionLike {
  id: string;
  isActive: boolean;
  isDeleted: boolean;
}

type ResolveFocusedCollectionOptions<T extends FocusedCollectionLike> = {
  /** Collection of the current page, if any. */
  activeCollectionId?: string;
  /** Last collection the user focused in the switcher. */
  rememberedCollectionId?: string;
  /** Lookup a collection by id, including archived collections still in memory. */
  getCollection: (id: string) => T | undefined;
  /** Ordered fallbacks used when the page has no collection context. */
  fallbacks: T[];
};

/**
 * Resolves which collection the focused sidebar and collection bar should show.
 *
 * Prefers the collection of the current page, then the last focused collection,
 * then the first available fallback.
 *
 * @param options Lookup inputs for the current page and remembered collection.
 * @returns the collection to display, or undefined when none are available.
 */
export function resolveFocusedCollection<T extends FocusedCollectionLike>(
  options: ResolveFocusedCollectionOptions<T>
): T | undefined {
  const {
    activeCollectionId,
    rememberedCollectionId,
    getCollection,
    fallbacks,
  } = options;

  const active = activeCollectionId
    ? getCollection(activeCollectionId)
    : undefined;
  if (active && !active.isDeleted) {
    return active;
  }

  const remembered = rememberedCollectionId
    ? getCollection(rememberedCollectionId)
    : undefined;
  if (remembered && remembered.isActive) {
    return remembered;
  }

  return fallbacks.find((collection) => collection.isActive);
}
