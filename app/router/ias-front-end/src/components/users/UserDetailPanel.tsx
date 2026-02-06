import { useState } from 'react';
import { 
  Drawer, 
  Tabs, 
  Paper, 
  Stack, 
  Grid, 
  TextInput, 
  Select, 
  Button, 
  Group as MantineGroup, 
  Table, 
  Checkbox, 
  Title, 
  Text,
  Divider
} from '@mantine/core';
import type { User, Group, FormErrors } from '../../types';
import { validateField } from '../../utils/validators';

interface UserDetailPanelProps {
  user: User | null;
  allUsers: User[];
  allGroups: Group[];
  userGroups: { [userId: string]: Group[] };
  onClose: () => void;
  onUpdate: (updatedUser: User) => void;
  onOpenAssignGroups: (userId: string) => void;
  onUnassignGroupFromUser: (userId: string, groupId: string) => void;
}

export const UserDetailPanel = ({
  user,
  allUsers,
  userGroups,
  onClose,
  onUpdate,
  onOpenAssignGroups,
  onUnassignGroupFromUser
}: UserDetailPanelProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState<User | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<{[key: string]: boolean}>({});
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(new Set());

  if (!user) return null;

  const currentUser = isEditing && editedUser ? editedUser : user;

  const handleEdit = () => {
    setIsEditing(true);
    setEditedUser({...user});
    setErrors({});
    setTouched({});
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedUser(null);
    setErrors({});
    setTouched({});
  };

  const validateForm = (): boolean => {
    if (!editedUser) return false;
    const newErrors: FormErrors = {};
    
    const emailError = validateField('email', editedUser.email, 'user', allUsers.filter(u => u.id !== user.id));
    if (emailError) newErrors.email = emailError;
    
    const lastNameError = validateField('lastName', editedUser.lastName, 'user', allUsers);
    if (lastNameError) newErrors.lastName = lastNameError;
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (editedUser && validateForm()) {
      onUpdate(editedUser);
      setIsEditing(false);
      setEditedUser(null);
    }
  };

  const updateField = (field: keyof User, value: string) => {
    if (!editedUser) return;
    setEditedUser({...editedUser, [field]: value});
    if (errors[field]) {
      setErrors({...errors, [field]: ''});
    }
  };

  const handleBlur = (field: keyof User) => {
    if (!editedUser) return;
    setTouched({...touched, [field]: true});
    if (field === 'email' || field === 'lastName') {
      const error = validateField(field, editedUser[field] as string, 'user', allUsers.filter(u => u.id !== user.id));
      if (error) {
        setErrors({...errors, [field]: error});
      }
    }
  };

  const renderField = (label: string, key: keyof User, readonly = false) => {
    const value = (currentUser[key] as string) || '';
    
    if (key === 'status' && isEditing && !readonly) {
      return (
        <Grid.Col span={6} key={key}>
          <Select
            label={label}
            value={value}
            onChange={(val) => updateField(key, val || '')}
            onBlur={() => handleBlur(key)}
            error={touched[key] ? errors[key] : undefined}
            data={[
              { value: 'Active', label: 'Active' },
              { value: 'Inactive', label: 'Inactive' }
            ]}
            readOnly={readonly}
          />
        </Grid.Col>
      );
    }

    if ((key === 'validFrom' || key === 'validTo') && isEditing && !readonly) {
      return (
        <Grid.Col span={6} key={key}>
          <TextInput
            label={label}
            type="date"
            value={value}
            onChange={(e) => updateField(key, e.target.value)}
            onBlur={() => handleBlur(key)}
            error={touched[key] ? errors[key] : undefined}
          />
        </Grid.Col>
      );
    }
    
    return (
      <Grid.Col span={6} key={key}>
        {isEditing && !readonly ? (
          <TextInput
            label={label}
            value={value}
            onChange={(e) => updateField(key, e.target.value)}
            onBlur={() => handleBlur(key)}
            error={touched[key] ? errors[key] : undefined}
            readOnly={readonly}
          />
        ) : (
          <div>
            <Text size="sm" fw={500} c="dimmed" mb={4}>{label}</Text>
            <Text size="sm">{value || '-'}</Text>
          </div>
        )}
      </Grid.Col>
    );
  };

  const assignedGroups = userGroups[user.id] || [];
  const allGroupsSelected = assignedGroups.length > 0 && selectedGroupIds.size === assignedGroups.length;

  return (
    <Drawer
      opened={!!user}
      onClose={onClose}
      position="right"
      size={600}
      title={
        <Stack gap="xs">
          <Title order={2}>{currentUser.lastName}</Title>
          <Text size="sm" c="dimmed">{currentUser.email}</Text>
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
            <Button onClick={handleEdit}>Edit</Button>
          )}
        </MantineGroup>

        <Tabs defaultValue="details">
          <Tabs.List>
            <Tabs.Tab value="details">Details</Tabs.Tab>
            <Tabs.Tab value="groups">Groups</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="details" pt="md">
            <Stack gap="lg">
              <div>
                <Grid>
                  {renderField('Last Name', 'lastName', false)}
                  {renderField('Email', 'email', false)}
                  {renderField('User Type', 'userType', false)}
                  {renderField('Login Name', 'loginName', false)}
                  {renderField('Status', 'status', false)}
                </Grid>
              </div>

              <Divider />

              <div>
                <Grid>
                  {renderField('First Name', 'firstName', false)}
                  {renderField('Valid From', 'validFrom', false)}
                  {renderField('Valid To', 'validTo', false)}
                  {renderField('Company', 'company', false)}
                  {renderField('Country', 'country', false)}
                  {renderField('City', 'city', false)}
                </Grid>
              </div>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="groups" pt="md">
            <Stack gap="md">
              <MantineGroup justify="space-between" align="center">
                <Title order={4}>Assigned Groups</Title>
                <MantineGroup gap="sm">
                  <Button size="sm" onClick={() => onOpenAssignGroups(user.id)}>
                    Assign
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    color="red"
                    onClick={() => {
                      if (selectedGroupIds.size === 0) return;
                      if (window.confirm(`Unassign ${selectedGroupIds.size} group(s) from this user?`)) {
                        selectedGroupIds.forEach(groupId => {
                          onUnassignGroupFromUser(user.id, groupId);
                        });
                        setSelectedGroupIds(new Set());
                      }
                    }}
                    disabled={selectedGroupIds.size === 0}
                  >
                    Unassign
                  </Button>
                </MantineGroup>
              </MantineGroup>

              <Paper withBorder>
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th style={{ width: 50 }}>
                        <Checkbox 
                          checked={allGroupsSelected}
                          onChange={(e) => {
                            if (e.currentTarget.checked) {
                              setSelectedGroupIds(new Set(assignedGroups.map(g => g.id)));
                            } else {
                              setSelectedGroupIds(new Set());
                            }
                          }}
                        />
                      </Table.Th>
                      <Table.Th>Display Name</Table.Th>
                      <Table.Th>Name</Table.Th>
                      <Table.Th>Description</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {assignedGroups.length === 0 ? (
                      <Table.Tr>
                        <Table.Td colSpan={4} style={{textAlign: 'center', padding: '40px'}}>
                          <Text c="dimmed">No groups assigned to this user</Text>
                        </Table.Td>
                      </Table.Tr>
                    ) : (
                      assignedGroups.map((group) => (
                        <Table.Tr key={group.id}>
                          <Table.Td>
                            <Checkbox
                              checked={selectedGroupIds.has(group.id)}
                              onChange={() => {
                                const newSelected = new Set(selectedGroupIds);
                                if (newSelected.has(group.id)) {
                                  newSelected.delete(group.id);
                                } else {
                                  newSelected.add(group.id);
                                }
                                setSelectedGroupIds(newSelected);
                              }}
                            />
                          </Table.Td>
                          <Table.Td>{group.displayName}</Table.Td>
                          <Table.Td>{group.name}</Table.Td>
                          <Table.Td>{group.description || '-'}</Table.Td>
                        </Table.Tr>
                      ))
                    )}
                  </Table.Tbody>
                </Table>
              </Paper>
            </Stack>
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Drawer>
  );
};
