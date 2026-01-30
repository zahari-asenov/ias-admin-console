import { useState } from 'react';
import { Button, Group } from '@mantine/core';
import type { User, UserFormData, FormErrors } from '../../types';
import { Modal } from '../common/Modal';
import { UserForm } from './UserForm';
import { validateUserForm } from '../../utils/validators';
import { generateScimId, generateUserId } from '../../utils/generators';


interface CreateUserModalProps {
  isOpen: boolean;
  allUsers: User[];
  onClose: () => void;
  onCreateUser: (user: User) => void;
}

export const CreateUserModal = ({
  isOpen,
  allUsers,
  onClose,
  onCreateUser
}: CreateUserModalProps) => {
  // Form data state
  const [formData, setFormData] = useState<UserFormData>({
    firstName: '',
    lastName: '',
    email: '',
    loginName: '',
    userType: 'Employee'
  });
  
  // Validation errors state
  const [errors, setErrors] = useState<FormErrors>({});
  
  // Track which fields have been touched (for showing errors only after user interacts)
  const [touched, setTouched] = useState<{[key: string]: boolean}>({});

  // Reset form to initial state
  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      loginName: '',
      userType: 'Employee'
    });
    setErrors({});
    setTouched({});
  };

  // Handle field value changes
  const handleFieldChange = (field: keyof UserFormData, value: string) => {
    setFormData({...formData, [field]: value});
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors({...errors, [field]: ''});
    }
  };

  // Handle field blur (when user leaves a field)
  const handleFieldBlur = (field: keyof UserFormData) => {
    setTouched({...touched, [field]: true});
    // Validate this field
    const newErrors = validateUserForm(formData, allUsers);
    if (newErrors[field]) {
      setErrors({...errors, [field]: newErrors[field]});
    }
  };

  // Handle create button click
  const handleCreate = () => {
    // Validate entire form
    const newErrors = validateUserForm(formData, allUsers);
    setErrors(newErrors);
    
    // If no errors, create the user
    if (Object.keys(newErrors).length === 0) {
      const newUser: User = {
        id: Date.now().toString(),
        // Required fields
        lastName: formData.lastName,
        email: formData.email,
        userType: formData.userType,
        loginName: formData.loginName || formData.email.split('@')[0], // Default to email prefix if not provided
        status: 'Active',
        // Optional fields (only include if they have values)
        userId: generateUserId(allUsers.length),
        firstName: formData.firstName || undefined,
        // System-generated fields
        scimId: generateScimId(),
        globalUserId: `G${generateUserId(allUsers.length)}`
      };
      
      onCreateUser(newUser);
      resetForm();
      onClose();
    } else {
      // Mark all required fields as touched to show errors
      setTouched({
        firstName: true,
        lastName: true,
        email: true,
        loginName: true,
        userType: true
      });
    }
  };

  // Handle close/cancel
  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      title="Create New User"
      onClose={handleClose}
      footer={
        <Group justify="flex-end" gap="sm">
          <Button onClick={handleCreate}>
          Create
        </Button>
        <Button variant="outline" onClick={handleClose}>
          Cancel
        </Button>
      </Group>
      }
    >
      <UserForm
        formData={formData}
        errors={errors}
        touched={touched}
        allUsers={allUsers}
        onFieldChange={handleFieldChange}
        onFieldBlur={handleFieldBlur}
      />
    </Modal>
  );
};
