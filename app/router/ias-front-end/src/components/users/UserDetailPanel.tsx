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
import { useMediaQuery } from '@mantine/hooks';
import type { User, Group, FormErrors } from '../../types';
import { validateField } from '../../utils/validators';
import { COUNTRIES, getCountryName } from '../../data/countries';

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
  const [activeTab, setActiveTab] = useState<string>('details');
  const showDescription = useMediaQuery('(min-width: 650px)');

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
    
    const selectDropdownProps = {
      maxDropdownHeight: 280,
      comboboxProps: {
        offset: 0,
        shadow: 'sm'
      } as const,
      styles: {
        dropdown: {
          border: '2px solid var(--mantine-color-default-border)'
        },
        option: {
          borderBottom: '1px solid var(--mantine-color-gray-3)'
        }
      }
    };

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
            {...selectDropdownProps}
          />
        </Grid.Col>
      );
    }

    if (key === 'userType' && isEditing && !readonly) {
      return (
        <Grid.Col span={6} key={key}>
          <Select
            label={label}
            value={value}
            onChange={(val) => updateField(key, val || '')}
            onBlur={() => handleBlur(key)}
            error={touched[key] ? errors[key] : undefined}
            data={[
              { value: 'Customer', label: 'Customer' },
              { value: 'Employee', label: 'Employee' },
              { value: 'Partner', label: 'Partner' },
              { value: 'Public', label: 'Public' },
              { value: 'External', label: 'External' },
              { value: 'Onboardee', label: 'Onboardee' },
              { value: 'Alumni', label: 'Alumni' }
            ]}
            readOnly={readonly}
            {...selectDropdownProps}
          />
        </Grid.Col>
      );
    }

    if (key === 'country') {
      if (isEditing && !readonly) {
        return (
          <Grid.Col span={6} key={key}>
            <Select
              label={label}
              value={value || null}
              onChange={(val) => updateField(key, val || '')}
              onBlur={() => handleBlur(key)}
              error={touched[key] ? errors[key] : undefined}
              data={COUNTRIES}
              searchable
              clearable
              placeholder="Select country"
              {...selectDropdownProps}
            />
          </Grid.Col>
        );
      }
      const countryLabel = value ? getCountryName(value) || value : '-';
      return (
        <Grid.Col span={6} key={key}>
          <div>
            <Text size="sm" fw={500} c="dimmed" mb={4}>{label}</Text>
            <Text size="sm" style={{ wordWrap: 'break-word', whiteSpace: 'normal', overflowWrap: 'break-word' }}>
              {countryLabel}
            </Text>
          </div>
        </Grid.Col>
      );
    }

    if (key === 'validFrom' || key === 'validTo') {
      // Normalize for date input: ISO string -> YYYY-MM-DD
      const dateValue = (value && typeof value === 'string')
        ? value.slice(0, 10)
        : (value || '');

      if (isEditing && !readonly) {
        return (
          <Grid.Col span={6} key={key}>
            <TextInput
              label={label}
              type="date"
              value={dateValue}
              min="1900-01-01"
              onChange={(e) => updateField(key, e.target.value)}
              onBlur={() => handleBlur(key)}
              error={touched[key] ? errors[key] : undefined}
            />
          </Grid.Col>
        );
      }

      return (
        <Grid.Col span={6} key={key}>
          <div>
            <Text size="sm" fw={500} c="dimmed" mb={4}>{label}</Text>
            <Text size="sm" style={{ wordWrap: 'break-word', whiteSpace: 'normal', overflowWrap: 'break-word' }}>
              {dateValue || '-'}
            </Text>
          </div>
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
            maxLength={key === 'firstName' || key === 'lastName' ? 65 : undefined}
          />
        ) : (
          <div>
            <Text size="sm" fw={500} c="dimmed" mb={4}>{label}</Text>
            <Text size="sm" style={{ wordWrap: 'break-word', whiteSpace: 'normal', overflowWrap: 'break-word' }}>{value || '-'}</Text>
          </div>
        )}
      </Grid.Col>
    );
  };

  const assignedGroups = userGroups[user.id] || [];
  const allGroupsSelected = assignedGroups.length > 0 && selectedGroupIds.size === assignedGroups.length;

  const fullName = [currentUser.firstName, currentUser.lastName].filter(Boolean).join(' ') || currentUser.lastName;

  return (
    <Drawer
      opened={!!user}
      onClose={onClose}
      position="right"
      size="max(320px, min(650px, max(42vw, 100vw)))"
      offset={0}
      styles={{
        title: {
          minWidth: 0,
          maxWidth: 'calc(100% - 80px)',
          overflow: 'hidden'
        }
      }}
      title={
        <Stack gap="xs" style={{ minWidth: 0, maxWidth: '100%' }}>
          <Text 
            size="xl" 
            fw={700}
            title={fullName}
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {fullName}
          </Text>
          <Text 
            size="sm" 
            c="dimmed"
            title={currentUser.email}
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {currentUser.email}
          </Text>
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
            <Button 
              onClick={handleEdit}
              style={{ visibility: activeTab === 'details' ? 'visible' : 'hidden' }}
            >
              Edit
            </Button>
          )}
        </MantineGroup>

        <Tabs value={activeTab} onChange={(value) => setActiveTab(value || 'details')}>
          <Tabs.List>
            <Tabs.Tab value="details">Details</Tabs.Tab>
            <Tabs.Tab value="groups">Groups</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="details" pt="md">
            <Stack gap="lg">
              <div>
                <Grid>
                  <Grid.Col span={12}>
                    <div>
                      <Text size="sm" fw={500} c="dimmed" mb={4}>SCIM ID</Text>
                      <Text size="sm" style={{ fontFamily: 'monospace', fontSize: '13px', wordWrap: 'break-word', whiteSpace: 'normal', overflowWrap: 'break-word' }}>
                        {currentUser.id}
                      </Text>
                    </div>
                  </Grid.Col>
                  {renderField('First Name', 'firstName', false)}
                  {renderField('Last Name', 'lastName', false)}
                  {renderField('Email', 'email', false)}
                  {renderField('User Type', 'userType', false)}
                  {renderField('Login Name', 'loginName', false)}
                  {renderField('Status', 'status', false)}
                  {renderField('Country', 'country', false)}
                  {renderField('City', 'city', false)}
                </Grid>
              </div>
              
              <Divider />

              <div>
                
                <Grid>
                  {renderField('Valid From', 'validFrom', false)}
                  {renderField('Valid To', 'validTo', false)}
                </Grid>
              </div>

              <Divider />

              <div>
                <Grid>
                  {renderField('Company', 'company', false)}
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
                      selectedGroupIds.forEach(groupId => {
                        onUnassignGroupFromUser(user.id, groupId);
                      });
                      setSelectedGroupIds(new Set());
                    }}
                    disabled={selectedGroupIds.size === 0}
                  >
                    Unassign
                  </Button>
                </MantineGroup>
              </MantineGroup>

              <Paper withBorder style={{ overflow: 'hidden' }}>
                <Table style={{ tableLayout: 'fixed', width: '100%' }}>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th style={{ width: 48, minWidth: 48 }}>
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
                      <Table.Th style={{ width: showDescription ? '25%' : '45%' }}>Display Name</Table.Th>
                      <Table.Th style={{ width: showDescription ? '25%' : '53%' }}>Name</Table.Th>
                      {showDescription && (
                        <Table.Th style={{ width: '40%' }}>Description</Table.Th>
                      )}
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {assignedGroups.length === 0 ? (
                      <Table.Tr>
                        <Table.Td colSpan={showDescription ? 4 : 3} style={{textAlign: 'center', padding: '40px'}}>
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
                          <Table.Td style={{ wordWrap: 'break-word', whiteSpace: 'normal', overflowWrap: 'break-word' }}>
                            {group.displayName}
                          </Table.Td>
                          <Table.Td style={{ wordWrap: 'break-word', whiteSpace: 'normal', overflowWrap: 'break-word' }}>
                            {group.name}
                          </Table.Td>
                          {showDescription && (
                            <Table.Td style={{ wordWrap: 'break-word', whiteSpace: 'normal', overflowWrap: 'break-word' }}>
                              {group.description || '-'}
                            </Table.Td>
                          )}
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
