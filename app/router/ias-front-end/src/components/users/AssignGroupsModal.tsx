import { useState } from 'react';
import { Button, Group as MantineGroup, TextInput, Table, Checkbox, Stack } from '@mantine/core';
import type { Group } from '../../types';
import { Modal } from '../common/Modal';

interface AssignGroupsModalProps {
  isOpen: boolean;
  userId: string | null;
  allGroups: Group[];
  currentGroups: Group[]; // Groups already assigned to this user
  onClose: () => void;
  onAssignGroups: (userId: string, groupIds: string[]) => void;
}

export const AssignGroupsModal = ({
  isOpen,
  userId,
  allGroups,
  currentGroups,
  onClose,
  onAssignGroups
}: AssignGroupsModalProps) => {
  // State: which groups are selected for assignment
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(new Set());
  
  // State: search term for filtering groups
  const [searchTerm, setSearchTerm] = useState('');

  // Calculate which groups are available (not already assigned)
  const currentGroupIds = new Set(currentGroups.map(g => g.id));
  const availableGroups = allGroups.filter(g => !currentGroupIds.has(g.id));

  // Filter available groups based on search term
  const filteredGroups = availableGroups.filter(group => {
    if (searchTerm === '') return true; // Show all if no search
    
    const lowerSearch = searchTerm.toLowerCase();
    return (
      group.name.toLowerCase().includes(lowerSearch) ||
      group.displayName.toLowerCase().includes(lowerSearch) ||
      group.id.toLowerCase().includes(lowerSearch) ||
      group.description.toLowerCase().includes(lowerSearch)
    );
  });

  // Handle "select all" checkbox
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      // Select all filtered groups
      setSelectedGroupIds(new Set(filteredGroups.map(g => g.id)));
    } else {
      // Deselect all
      setSelectedGroupIds(new Set());
    }
  };

  // Handle individual group checkbox
  const handleSelectGroup = (groupId: string) => {
    const newSelected = new Set(selectedGroupIds);
    if (newSelected.has(groupId)) {
      newSelected.delete(groupId); // Deselect if already selected
    } else {
      newSelected.add(groupId); // Select if not selected
    }
    setSelectedGroupIds(newSelected);
  };

  // Handle assign button click
  const handleAssign = () => {
    if (userId && selectedGroupIds.size > 0) {
      onAssignGroups(userId, Array.from(selectedGroupIds));
      // Reset state and close modal
      setSelectedGroupIds(new Set());
      setSearchTerm('');
      onClose();
    }
  };

  // Handle close/cancel
  const handleClose = () => {
    // Reset state
    setSelectedGroupIds(new Set());
    setSearchTerm('');
    onClose();
  };

  // Check if all filtered groups are selected (for "select all" checkbox state)
  const allSelected = filteredGroups.length > 0 && selectedGroupIds.size === filteredGroups.length;

  return (
    <Modal
      isOpen={isOpen}
      title="Assign Groups"
      onClose={handleClose}
      size="xl"
      footer={
        <MantineGroup justify="flex-end" gap="sm">
          <Button 
            onClick={handleAssign}
          >
            Assign 
          </Button>
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          
        </MantineGroup>
      }
    >
      <Stack gap="md">
        {/* Search input */}
        <TextInput
          placeholder="Search groups by name, display name, or ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        
        {/* Groups table */}
        <Table style={{ tableLayout: 'fixed', width: '100%' }}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th style={{ width: 48, minWidth: 48 }}>
                <Checkbox 
                  checked={allSelected}
                  onChange={handleSelectAll}
                />
              </Table.Th>
              <Table.Th style={{ width: '22%' }}>ID</Table.Th>
              <Table.Th style={{ width: '24%' }}>Display Name</Table.Th>
              <Table.Th style={{ width: '24%' }}>Name</Table.Th>
              <Table.Th style={{ width: '28%' }}>Description</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filteredGroups.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={5} style={{textAlign: 'center', color: 'var(--mantine-color-gray-6)'}}>
                  {availableGroups.length === 0 
                    ? 'All groups are already assigned' 
                    : 'No groups found'}
                </Table.Td>
              </Table.Tr>
            ) : (
              filteredGroups.map((group) => (
                <Table.Tr key={group.id}>
                  <Table.Td>
                    <Checkbox 
                      checked={selectedGroupIds.has(group.id)}
                      onChange={() => handleSelectGroup(group.id)}
                    />
                  </Table.Td>
                <Table.Td style={{ fontFamily: 'monospace', fontSize: '13px', wordWrap: 'break-word', whiteSpace: 'normal', overflowWrap: 'break-word' }}>
                  {group.id}
                </Table.Td>
                <Table.Td style={{ wordWrap: 'break-word', whiteSpace: 'normal', overflowWrap: 'break-word' }}>
                  {group.displayName}
                </Table.Td>
                <Table.Td style={{ wordWrap: 'break-word', whiteSpace: 'normal', overflowWrap: 'break-word' }}>
                  {group.name}
                </Table.Td>
                <Table.Td style={{ wordWrap: 'break-word', whiteSpace: 'normal', overflowWrap: 'break-word' }}>
                  {group.description || '-'}
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
