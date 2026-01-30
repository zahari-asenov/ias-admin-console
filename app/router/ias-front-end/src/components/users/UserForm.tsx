import { TextInput, Select, Stack } from '@mantine/core';
import type { UserFormData, FormErrors, User } from '../../types';

interface UserFormProps {
  formData: UserFormData;
  errors: FormErrors;
  touched: {[key: string]: boolean};
  allUsers: User[];
  onFieldChange: (field: keyof UserFormData, value: string) => void;
  onFieldBlur: (field: keyof UserFormData) => void;
}

export const UserForm = ({
  formData,
  errors,
  touched,
  onFieldChange,
  onFieldBlur
}: UserFormProps) => {
  return (
    <Stack gap="md">
      <TextInput
        label="First Name"
        value={formData.firstName}
        onChange={(e) => onFieldChange('firstName', e.target.value)}
        onBlur={() => onFieldBlur('firstName')}
      />

      <TextInput
        label="Last Name"
        required
        value={formData.lastName}
        onChange={(e) => onFieldChange('lastName', e.target.value)}
        onBlur={() => onFieldBlur('lastName')}
        error={touched.lastName ? errors.lastName : undefined}
      />

      <TextInput
        label="Email"
        type="email"
        required
        value={formData.email}
        onChange={(e) => onFieldChange('email', e.target.value)}
        onBlur={() => onFieldBlur('email')}
        error={touched.email ? errors.email : undefined}
      />

      <Select
        label="User Type"
        required
        value={formData.userType}
        onChange={(value) => onFieldChange('userType', value || 'Employee')}
        data={[
          { value: 'Employee', label: 'Employee' },
          { value: 'Contractor', label: 'Contractor' },
          { value: 'External', label: 'External' }
        ]}
      />

      <TextInput
        label="Login Name"
        required
        value={formData.loginName}
        onChange={(e) => onFieldChange('loginName', e.target.value)}
        onBlur={() => onFieldBlur('loginName')}
      />
    </Stack>
  );
};
