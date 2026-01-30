import { TextInput, Textarea, Stack } from '@mantine/core';
import type { GroupFormData, FormErrors, Group } from '../../types';

interface GroupFormProps {
  formData: GroupFormData;
  errors: FormErrors;
  touched: {[key: string]: boolean};
  allGroups: Group[];
  onFieldChange: (field: keyof GroupFormData, value: string) => void;
  onFieldBlur: (field: keyof GroupFormData) => void;
}

export const GroupForm = ({
  formData,
  errors,
  touched,
  onFieldChange,
  onFieldBlur
}: GroupFormProps) => {
  return (
    <Stack gap="md">
      <TextInput
        label="Name"
        required
        value={formData.name}
        onChange={(e) => onFieldChange('name', e.target.value)}
        onBlur={() => onFieldBlur('name')}
        error={touched.name ? errors.name : undefined}
      />

      <TextInput
        label="Display Name"
        required
        value={formData.displayName}
        onChange={(e) => onFieldChange('displayName', e.target.value)}
        onBlur={() => onFieldBlur('displayName')}
        error={touched.displayName ? errors.displayName : undefined}
      />

      <Textarea
        label="Description"
        value={formData.description}
        onChange={(e) => onFieldChange('description', e.target.value)}
        rows={3}
      />
    </Stack>
  );
};
