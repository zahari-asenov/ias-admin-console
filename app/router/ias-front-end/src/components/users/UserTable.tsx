import { Table, Checkbox, Paper } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import type { User } from '../../types';

interface UserTableProps {
  users: User[];
  selectedIds: Set<string>;
  selectedUserId?: string;
  onSelectAll: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectUser: (userId: string) => void;
  onUserClick: (user: User) => void;
}

export const UserTable = ({
  users,
  selectedIds,
  selectedUserId,
  onSelectAll,
  onSelectUser,
  onUserClick
}: UserTableProps) => {
  const allSelected = users.length > 0 && selectedIds.size === users.length;
  const showLoginName = useMediaQuery('(min-width: 900px)');
  const showScimId = useMediaQuery('(min-width: 1100px)');

  const cellStyle = { wordWrap: 'break-word' as const, whiteSpace: 'normal' as const, overflowWrap: 'break-word' as const };

  // Column widths: 5 cols / 4 cols / 3 cols
  const colCount = [showLoginName, showScimId].filter(Boolean).length + 3;
  const firstWidth = colCount === 5 ? '18%' : colCount === 4 ? '22%' : '30%';
  const lastWidth = colCount === 5 ? '18%' : colCount === 4 ? '22%' : '30%';
  const emailWidth = colCount === 5 ? '22%' : colCount === 4 ? '26%' : '38%';

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
            <Table.Th style={{ width: firstWidth }}>First Name</Table.Th>
            <Table.Th style={{ width: lastWidth }}>Last Name</Table.Th>
            <Table.Th style={{ width: emailWidth }}>Email</Table.Th>
            {showLoginName && (
              <Table.Th style={{ width: colCount === 5 ? '14%' : '18%' }}>Login Name</Table.Th>
            )}
            {showScimId && (
              <Table.Th style={{ width: '20%' }}>SCIM ID</Table.Th>
            )}
            <Table.Th style={{ width: 32, minWidth: 32 }}></Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {users.map((user) => (
            <Table.Tr 
              key={user.id} 
              onClick={() => onUserClick(user)}
              style={{ 
                cursor: 'pointer',
                backgroundColor: selectedUserId === user.id ? 'var(--mantine-color-blue-0)' : undefined
              }}
            >
              <Table.Td onClick={(e) => e.stopPropagation()}>
                <Checkbox 
                  checked={selectedIds.has(user.id)}
                  onChange={() => onSelectUser(user.id)}
                />
              </Table.Td>
              <Table.Td style={cellStyle}>{user.firstName}</Table.Td>
              <Table.Td style={cellStyle}>{user.lastName}</Table.Td>
              <Table.Td style={cellStyle}>{user.email}</Table.Td>
              {showLoginName && (
                <Table.Td style={cellStyle}>{user.loginName}</Table.Td>
              )}
              {showScimId && (
                <Table.Td style={{ ...cellStyle, fontFamily: 'monospace', fontSize: '13px' }}>
                  {user.id}
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
