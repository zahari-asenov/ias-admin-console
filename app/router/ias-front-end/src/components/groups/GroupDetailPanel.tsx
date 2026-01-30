import { useState } from 'react';
import { 
  Drawer, 
  Paper, 
  Stack, 
  Grid, 
  TextInput, 
  Textarea,
  Button, 
  Group as MantineGroup, 
  Table, 
  Checkbox, 
  Title, 
  Text,
  Divider
} from '@mantine/core';
import type { Group, User, FormErrors } from '../../types';
import { validateField } from '../../utils/validators';

interface GroupDetailPanelProps {
  group: Group | null;
  allGroups: Group[];
  groupMembers: { [groupId: string]: User[] };
  onClose: () => void;
  onUpdate: (updatedGroup: Group) => void;
  onOpenAddUsers: (groupId: string) => void;
  onRemoveUserFromGroup: (groupId: string, userId: string) => void;
}

export const GroupDetailPanel = ({
  group,
  allGroups,
  groupMembers,
  onClose,
  onUpdate,
  onOpenAddUsers,
  onRemoveUserFromGroup
}: GroupDetailPanelProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedGroup, setEditedGroup] = useState<Group | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<{[key: string]: boolean}>({});
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set());

  if (!group) return null;

  const currentGroup = isEditing && editedGroup ? editedGroup : group;
  const members = groupMembers[group.id] || [];

  const filteredMembers = members.filter(user =>
    memberSearchTerm === '' ||
    user.scimId.toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
    user.loginName.toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
    user.firstName?.toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
    user.lastName.toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(memberSearchTerm.toLowerCase())
  );

  const handleEdit = () => {
    setIsEditing(true);
    setEditedGroup({...group});
    setErrors({});
    setTouched({});
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedGroup(null);
    setErrors({});
    setTouched({});
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete the group "${group.name}"?`)) {
      onClose();
    }
  };

  const validateForm = (): boolean => {
    if (!editedGroup) return false;
    const newErrors: FormErrors = {};
    
    const nameError = validateField('name', editedGroup.name, 'group', allGroups.filter(g => g.id !== group.id));
    if (nameError) newErrors.name = nameError;
    
    const displayNameError = validateField('displayName', editedGroup.displayName, 'group', allGroups);
    if (displayNameError) newErrors.displayName = displayNameError;
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (editedGroup && validateForm()) {
      onUpdate(editedGroup);
      setIsEditing(false);
      setEditedGroup(null);
    }
  };

  const updateField = (field: keyof Group, value: string) => {
    if (!editedGroup) return;
    setEditedGroup({...editedGroup, [field]: value});
    if (errors[field]) {
      setErrors({...errors, [field]: ''});
    }
  };

  const handleBlur = (field: keyof Group) => {
    if (!editedGroup) return;
    setTouched({...touched, [field]: true});
    if (field === 'name' || field === 'displayName') {
      const error = validateField(field, editedGroup[field] as string, 'group', allGroups.filter(g => g.id !== group.id));
      if (error) {
        setErrors({...errors, [field]: error});
      }
    }
  };

  const handleSelectMember = (userId: string) => {
    const newSelected = new Set(selectedMemberIds);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedMemberIds(newSelected);
  };

  const handleSelectAllMembers = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedMemberIds(new Set(filteredMembers.map(u => u.id)));
    } else {
      setSelectedMemberIds(new Set());
    }
  };

  const handleRemoveSelected = () => {
    if (selectedMemberIds.size === 0) return;
    if (window.confirm(`Remove ${selectedMemberIds.size} user(s) from this group?`)) {
      selectedMemberIds.forEach(userId => {
        onRemoveUserFromGroup(group.id, userId);
      });
      setSelectedMemberIds(new Set());
    }
  };

  const allMembersSelected = filteredMembers.length > 0 && selectedMemberIds.size === filteredMembers.length;

  return (
    <Drawer
      opened={!!group}
      onClose={onClose}
      position="right"
      size={600}
      title={
        <Stack gap="xs">
          <Title order={2}>{currentGroup.name}</Title>
          <Text size="sm" c="dimmed">{currentGroup.groupId}</Text>
        </Stack>
      }
    >
      <Stack gap="md">
        <MantineGroup justify="flex-end">
          {isEditing ? (
            <>
              <Button onClick={handleSave}>Save</Button>
              <Button variant="outline" onClick={handleCancel}>Cancel</Button>
            </>
          ) : (
            <>
              <Button onClick={handleEdit}>Edit</Button>
              <Button variant="outline" color="red" onClick={handleDelete}>Delete</Button>
            </>
          )}
        </MantineGroup>

        <Divider />

        <div>
          <Grid>
            <Grid.Col span={6}>
              <div>
                <Text size="sm" fw={500} c="dimmed" mb={4}>Group ID</Text>
                <Text size="sm">{currentGroup.groupId}</Text>
              </div>
            </Grid.Col>
            <Grid.Col span={6}>
              {isEditing ? (
                <TextInput
                  label="Display Name"
                  value={(editedGroup?.displayName as string) || ''}
                  onChange={(e) => updateField('displayName', e.target.value)}
                  onBlur={() => handleBlur('displayName')}
                  error={touched.displayName ? errors.displayName : undefined}
                />
              ) : (
                <div>
                  <Text size="sm" fw={500} c="dimmed" mb={4}>Display Name</Text>
                  <Text size="sm">{currentGroup.displayName}</Text>
                </div>
              )}
            </Grid.Col>
            <Grid.Col span={6}>
              <div>
                <Text size="sm" fw={500} c="dimmed" mb={4}>Name</Text>
                <Text size="sm">{currentGroup.name}</Text>
              </div>
            </Grid.Col>
            <Grid.Col span={6}>
              {isEditing ? (
                <Textarea
                  label="Description"
                  value={(editedGroup?.description as string) || ''}
                  onChange={(e) => updateField('description', e.target.value)}
                  rows={3}
                />
              ) : (
                <div>
                  <Text size="sm" fw={500} c="dimmed" mb={4}>Description</Text>
                  <Text size="sm">{currentGroup.description || '-'}</Text>
                </div>
              )}
            </Grid.Col>
          </Grid>
        </div>

        <Divider />

        <div>
          <Stack gap="md">
            <MantineGroup justify="space-between" align="center">
              <Title order={4}>User Members</Title>
              <MantineGroup gap="sm">
                <Button size="sm" onClick={() => onOpenAddUsers(group.id)}>
                  Add
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  color="red"
                  onClick={handleRemoveSelected}
                  disabled={selectedMemberIds.size === 0}
                >
                  Remove
                </Button>
              </MantineGroup>
            </MantineGroup>

            <TextInput
              placeholder="Search by SCIM ID, Login Name..."
              value={memberSearchTerm}
              onChange={(e) => setMemberSearchTerm(e.target.value)}
            />

            <Text size="sm" c="dimmed">
              Users ({filteredMembers.length} out of {members.length})
            </Text>

            <Paper withBorder>
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th style={{ width: 50 }}>
                      <Checkbox 
                        checked={allMembersSelected}
                        onChange={handleSelectAllMembers}
                      />
                    </Table.Th>
                    <Table.Th>First Name</Table.Th>
                    <Table.Th>Last Name</Table.Th>
                    <Table.Th>Email</Table.Th>
                    <Table.Th>Login Name</Table.Th>
                    <Table.Th>SCIM ID</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {filteredMembers.length === 0 ? (
                    <Table.Tr>
                      <Table.Td colSpan={6} style={{textAlign: 'center', padding: '40px'}}>
                        <Text c="dimmed">
                          {members.length === 0 ? 'No members in this group' : 'No matching members found'}
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  ) : (
                    filteredMembers.map((user) => (
                      <Table.Tr key={user.id}>
                        <Table.Td>
                          <Checkbox
                            checked={selectedMemberIds.has(user.id)}
                            onChange={() => handleSelectMember(user.id)}
                          />
                        </Table.Td>
                        <Table.Td>{user.firstName}</Table.Td>
                        <Table.Td>{user.lastName}</Table.Td>
                        <Table.Td>{user.email}</Table.Td>
                        <Table.Td>{user.loginName}</Table.Td>
                        <Table.Td style={{ fontFamily: 'monospace', fontSize: '13px' }}>
                          {user.scimId}
                        </Table.Td>
                      </Table.Tr>
                    ))
                  )}
                </Table.Tbody>
              </Table>
            </Paper>
          </Stack>
        </div>
      </Stack>
    </Drawer>
  );
};
