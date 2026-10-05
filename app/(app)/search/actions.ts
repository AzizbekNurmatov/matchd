"use server";

import { searchCatalog, type SearchResults } from "@/lib/search";

export async function searchCatalogAction(
  query: string,
): Promise<SearchResults> {
  return searchCatalog(query);
}
