import { Table, Checkbox, Paper } from '@mantine/core';
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
            <Table.Th>Last Name</Table.Th>
            <Table.Th>Email</Table.Th>
            <Table.Th>User Type</Table.Th>
            <Table.Th>Login Name</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th style={{ width: 50 }}>›</Table.Th>
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
                  onChange={() => {
                    onSelectUser(user.id); // This calls toggleSelection
                  }}
                />
              </Table.Td>
              <Table.Td>{user.lastName}</Table.Td>
              <Table.Td>{user.email}</Table.Td>
              <Table.Td>{user.userType}</Table.Td>
              <Table.Td>{user.loginName}</Table.Td>
              <Table.Td>{user.status}</Table.Td>
              <Table.Td>›</Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Paper>
  );
};
