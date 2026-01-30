import { useState } from 'react';

export const useSelection = () => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const selectAll = (ids: string[]) => {
    setSelectedIds(new Set(ids));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const toggleSelectAll = (allIds: string[]) => {
    if (selectedIds.size === allIds.length) {
      clearSelection();
    } else {
      selectAll(allIds);
    }
  };

  return {
    selectedIds,
    toggleSelection,
    selectAll,
    clearSelection,
    toggleSelectAll
  };
};
