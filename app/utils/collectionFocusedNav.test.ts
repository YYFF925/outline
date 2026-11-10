import { resolveFocusedCollection } from "./collectionFocusedNav";

const collection = (
  id: string,
  flags: { isActive?: boolean; isDeleted?: boolean } = {}
) => ({
  id,
  isActive: flags.isActive ?? true,
  isDeleted: flags.isDeleted ?? false,
});

describe("resolveFocusedCollection", () => {
  const alpha = collection("alpha");
  const beta = collection("beta");
  const archived = collection("archived", { isActive: false });
  const deleted = collection("deleted", { isDeleted: true, isActive: false });
  const catalog = {
    alpha,
    beta,
    archived,
    deleted,
  };
  const getCollection = (id: string) => catalog[id as keyof typeof catalog];

  it("prefers the collection of the current page", () => {
    expect(
      resolveFocusedCollection({
        activeCollectionId: "beta",
        rememberedCollectionId: "alpha",
        getCollection,
        fallbacks: [alpha, beta],
      })
    ).toBe(beta);
  });

  it("keeps an archived collection when it is the current page", () => {
    expect(
      resolveFocusedCollection({
        activeCollectionId: "archived",
        rememberedCollectionId: "alpha",
        getCollection,
        fallbacks: [alpha, beta],
      })
    ).toBe(archived);
  });

  it("ignores a deleted current collection and uses the remembered one", () => {
    expect(
      resolveFocusedCollection({
        activeCollectionId: "deleted",
        rememberedCollectionId: "alpha",
        getCollection,
        fallbacks: [alpha, beta],
      })
    ).toBe(alpha);
  });

  it("falls back to the remembered collection when the page has none", () => {
    expect(
      resolveFocusedCollection({
        rememberedCollectionId: "beta",
        getCollection,
        fallbacks: [alpha, beta],
      })
    ).toBe(beta);
  });

  it("skips a remembered collection that is no longer active", () => {
    expect(
      resolveFocusedCollection({
        rememberedCollectionId: "archived",
        getCollection,
        fallbacks: [alpha, beta],
      })
    ).toBe(alpha);
  });

  it("uses the first active fallback when nothing is remembered", () => {
    expect(
      resolveFocusedCollection({
        getCollection,
        fallbacks: [alpha, beta],
      })
    ).toBe(alpha);
  });

  it("returns undefined when no collections are available", () => {
    expect(
      resolveFocusedCollection({
        getCollection,
        fallbacks: [],
      })
    ).toBeUndefined();
  });
});
