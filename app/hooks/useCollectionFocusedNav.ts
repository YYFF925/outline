import { useEffect } from "react";
import { UserPreference } from "@shared/types";
import { resolveFocusedCollection } from "~/utils/collectionFocusedNav";
import type Collection from "~/models/Collection";
import { useComputed } from "./useComputed";
import useCurrentUser from "./useCurrentUser";
import useStores from "./useStores";

/**
 * Whether collection-focused navigation is enabled for the current user.
 * Defaults to on so this fork uses the PandaWiki-style layout unless the user
 * turns it off in Preferences.
 *
 * @returns true when collections should appear under the workspace name and
 * the sidebar should show only the current collection's documents.
 */
export function useCollectionFocusedNav(): boolean {
  const user = useCurrentUser({ rejectOnEmpty: false });

  if (!user) {
    return true;
  }

  return user.getPreference(UserPreference.CollectionFocusedNav);
}

/**
 * The collection currently displayed by collection-focused navigation.
 * Remembers the last selection so Home, Search, and similar pages keep a tree.
 *
 * @returns the focused collection, or undefined when the workspace has none.
 */
export function useFocusedCollection(): Collection | undefined {
  const { ui, collections } = useStores();

  const collection = useComputed(() => {
    const fallbacks = [
      ...collections.allActive,
      ...(collections.personal ? [collections.personal] : []),
    ];

    return resolveFocusedCollection({
      activeCollectionId: ui.activeCollectionId,
      rememberedCollectionId: ui.focusedCollectionId,
      getCollection: (id) => collections.get(id),
      fallbacks,
    });
  }, [ui, collections]);

  useEffect(() => {
    if (collection && collection.id !== ui.focusedCollectionId) {
      ui.setFocusedCollectionId(collection.id);
    }
  }, [collection, ui]);

  return collection;
}
