import { useState } from 'react';
import { Button, Group as MantineGroup, TextInput, Table, Checkbox, Stack } from '@mantine/core';
import type { User } from '../../types';
import { Modal } from '../common/Modal';

interface AddUsersModalProps {
  isOpen: boolean;
  groupId: string | null;
  allUsers: User[];
  currentMembers: User[]; // Users already in this group
  onClose: () => void;
  onAddUsers: (groupId: string, userIds: string[]) => void;
}

export const AddUsersModal = ({
  isOpen,
  groupId,
  allUsers,
  currentMembers,
  onClose,
  onAddUsers
}: AddUsersModalProps) => {
  // State: which users are selected for adding
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  
  // State: search term for filtering users
  const [searchTerm, setSearchTerm] = useState('');

  // Calculate which users are available (not already members)
  const currentMemberIds = new Set(currentMembers.map(u => u.id));
  const availableUsers = allUsers.filter(u => !currentMemberIds.has(u.id));

  // Filter available users based on search term
  const filteredUsers = availableUsers.filter(user => {
    if (searchTerm === '') return true; // Show all if no search
    
    const lowerSearch = searchTerm.toLowerCase();
    return (
      user.firstName?.toLowerCase().includes(lowerSearch) ||
      user.lastName.toLowerCase().includes(lowerSearch) ||
      user.email.toLowerCase().includes(lowerSearch)
    );
  });

  // Handle "select all" checkbox
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      // Select all filtered users
      setSelectedUserIds(new Set(filteredUsers.map(u => u.id)));
    } else {
      // Deselect all
      setSelectedUserIds(new Set());
    }
  };

  // Handle individual user checkbox
  const handleSelectUser = (userId: string) => {
    const newSelected = new Set(selectedUserIds);
    if (newSelected.has(userId)) {
      newSelected.delete(userId); // Deselect if already selected
    } else {
      newSelected.add(userId); // Select if not selected
    }
    setSelectedUserIds(newSelected);
  };

  // Handle add button click
  const handleAdd = () => {
    if (groupId && selectedUserIds.size > 0) {
      onAddUsers(groupId, Array.from(selectedUserIds));
      // Reset state and close modal
      setSelectedUserIds(new Set());
      setSearchTerm('');
      onClose();
    }
  };

  // Handle close/cancel
  const handleClose = () => {
    // Reset state
    setSelectedUserIds(new Set());
    setSearchTerm('');
    onClose();
  };

  // Check if all filtered users are selected (for "select all" checkbox state)
  const allSelected = filteredUsers.length > 0 && selectedUserIds.size === filteredUsers.length;

  return (
    <Modal
      isOpen={isOpen}
      title="Add Users"
      onClose={handleClose}
      size="xl"
      footer={
        <MantineGroup justify="flex-end" gap="sm">
          <Button 
            onClick={handleAdd}
          >
            Add
          </Button>
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          
        </MantineGroup>
      }
    >
      <Stack gap="md">
        {/* Search input */}
        <TextInput
          placeholder="Search users by name, email, or ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        
        {/* Users table */}
        <Table style={{ tableLayout: 'fixed', width: '100%' }}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th style={{ width: 48, minWidth: 48 }}>
                <Checkbox 
                  checked={allSelected}
                  onChange={handleSelectAll}
                />
              </Table.Th>
              <Table.Th style={{ width: '30%' }}>First Name</Table.Th>
              <Table.Th style={{ width: '30%' }}>Last Name</Table.Th>
              <Table.Th style={{ width: '38%' }}>Email</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filteredUsers.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={4} style={{textAlign: 'center', color: 'var(--mantine-color-gray-6)'}}>
                  {availableUsers.length === 0 
                    ? 'All users are already members' 
                    : 'No users found'}
                </Table.Td>
              </Table.Tr>
            ) : (
              filteredUsers.map((user) => (
                <Table.Tr key={user.id}>
                  <Table.Td>
                    <Checkbox 
                      checked={selectedUserIds.has(user.id)}
                      onChange={() => handleSelectUser(user.id)}
                    />
                  </Table.Td>
                  <Table.Td style={{ wordWrap: 'break-word', whiteSpace: 'normal', overflowWrap: 'break-word' }}>
                    {user.firstName}
                  </Table.Td>
                  <Table.Td style={{ wordWrap: 'break-word', whiteSpace: 'normal', overflowWrap: 'break-word' }}>
                    {user.lastName}
                  </Table.Td>
                  <Table.Td style={{ wordWrap: 'break-word', whiteSpace: 'normal', overflowWrap: 'break-word' }}>
                    {user.email}
                  </Table.Td>
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
      </Stack>
    </Modal>
  );
};
