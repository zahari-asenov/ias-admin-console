import { Select, TextInput, Group, Paper } from '@mantine/core';
import type { ViewType } from '../../types';

interface SearchBarProps {
  viewType: ViewType;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onViewTypeChange: (viewType: ViewType) => void;
}

export const SearchBar = ({
  viewType,
  searchTerm,
  onSearchChange,
  onViewTypeChange
}: SearchBarProps) => {
  const placeholder = viewType === 'users' 
    ? "Search by Last Name, Email, Login Name, User Type or Status"
    : "Search by Group ID, Name, SCIM ID, Type or Description";

  return (
    <Paper p="md" withBorder>
      <Group gap="sm">
        <Select
          value={viewType}
          onChange={(value) => onViewTypeChange(value as ViewType)}
          data={[
            { value: 'users', label: 'Users' },
            { value: 'groups', label: 'Groups' }
          ]}
          style={{ width: 150 }}
        />
        <TextInput
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{ flex: 1 }}
        />
      </Group>
    </Paper>
  );
};
