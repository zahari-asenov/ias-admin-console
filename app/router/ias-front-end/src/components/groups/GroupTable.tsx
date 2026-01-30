import { Table, Checkbox, Paper } from '@mantine/core';
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

  return (
    <Paper withBorder>
      <Table highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th style={{ width: 50 }}>
              <Checkbox 
                checked={allSelected}
                onChange={onSelectAll}
              />
            </Table.Th>
            <Table.Th>Name</Table.Th>
            <Table.Th>Display Name</Table.Th>
            <Table.Th>Description</Table.Th>
            <Table.Th>SCIM ID</Table.Th>
            <Table.Th style={{ width: 50 }}>›</Table.Th>
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
                  onChange={() => {
                    onSelectGroup(group.id); // This calls toggleSelection
                  }}
                />
              </Table.Td>
              <Table.Td>{group.name}</Table.Td>
              <Table.Td>{group.displayName}</Table.Td>
              <Table.Td>{group.description}</Table.Td>
              <Table.Td style={{ fontFamily: 'monospace', fontSize: '13px', color: 'var(--mantine-color-gray-6)' }}>
                {group.scimId}
              </Table.Td>
              <Table.Td>›</Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Paper>
  );
};
