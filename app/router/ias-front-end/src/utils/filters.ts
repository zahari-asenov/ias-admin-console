/**
 * Generic search filter utility
 * Filters items by search term across multiple fields
 * 
 * @example
 * const filtered = createSearchFilter(users, "john", (user) => [
 *   user.lastName, user.email, user.loginName
 * ]);
 */
export const createSearchFilter = <T>(
  items: T[],
  searchTerm: string,
  getSearchableFields: (item: T) => (string | undefined)[]
): T[] => {
  if (!searchTerm.trim()) return items;
  
  const lowerSearch = searchTerm.toLowerCase();
  return items.filter(item => 
    getSearchableFields(item).some(field => 
      field?.toLowerCase().includes(lowerSearch)
    )
  );
};
