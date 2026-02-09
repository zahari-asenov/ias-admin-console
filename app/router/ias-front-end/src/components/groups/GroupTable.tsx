import { Table, Checkbox, Paper } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import type { Group } from '../../types';

interface GroupTableProps {
  groups: Group[];
  selectedIds: Set<string>;
  selectedGroupId?: string;
  onSelectAll: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectGroup: (groupId: string) => void;
  onGroupClick: (group: Group) => void;
}

export const GroupTable = ({
  groups,
  selectedIds,
  selectedGroupId,
  onSelectAll,
  onSelectGroup,
  onGroupClick
}: GroupTableProps) => {
  const allSelected = groups.length > 0 && selectedIds.size === groups.length;
  const showId = useMediaQuery('(min-width: 1000px)');
  const showDescription = useMediaQuery('(min-width: 750px)');

  const cellStyle = { wordWrap: 'break-word' as const, whiteSpace: 'normal' as const, overflowWrap: 'break-word' as const };

  // Column widths: 4 cols / 3 cols / 2 cols
  const colCount = [showDescription, showId].filter(Boolean).length + 2;
  const nameWidth = colCount === 4 ? '20%' : colCount === 3 ? '30%' : '45%';
  const displayNameWidth = colCount === 4 ? '20%' : colCount === 3 ? '32%' : '53%';

  return (
    <Paper withBorder style={{ overflow: 'hidden' }}>
      <Table highlightOnHover style={{ tableLayout: 'fixed', width: '100%' }}>
        <Table.Thead>
          <Table.Tr>
            <Table.Th style={{ width: 48, minWidth: 48 }}>
              <Checkbox 
                checked={allSelected}
                onChange={onSelectAll}
              />
            </Table.Th>
            <Table.Th style={{ width: nameWidth }}>Name</Table.Th>
            <Table.Th style={{ width: displayNameWidth }}>Display Name</Table.Th>
            {showDescription && (
              <Table.Th style={{ width: colCount === 4 ? '28%' : '36%' }}>Description</Table.Th>
            )}
            {showId && (
              <Table.Th style={{ width: '24%' }}>ID</Table.Th>
            )}
            <Table.Th style={{ width: 32, minWidth: 32 }}></Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {groups.map((group) => (
            <Table.Tr 
              key={group.id} 
              onClick={() => onGroupClick(group)}
              style={{ 
                cursor: 'pointer',
                backgroundColor: selectedGroupId === group.id ? 'var(--mantine-color-blue-0)' : undefined
              }}
            >
              <Table.Td onClick={(e) => e.stopPropagation()}>
                <Checkbox 
                  checked={selectedIds.has(group.id)}
                  onChange={() => onSelectGroup(group.id)}
                />
              </Table.Td>
              <Table.Td style={cellStyle}>{group.name}</Table.Td>
              <Table.Td style={cellStyle}>{group.displayName}</Table.Td>
              {showDescription && (
                <Table.Td style={cellStyle}>{group.description}</Table.Td>
              )}
              {showId && (
                <Table.Td style={{ ...cellStyle, fontFamily: 'monospace', fontSize: '13px', color: 'var(--mantine-color-gray-6)' }}>
                  {group.id}
                </Table.Td>
              )}
              <Table.Td>›</Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Paper>
  );
};
