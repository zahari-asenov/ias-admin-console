import type { User, Group, FormErrors } from '../types';

export const validateUserForm = (
  formData: { firstName: string; lastName: string; email: string; loginName: string; userType: string },
  existingUsers: User[]
): FormErrors => {
  const errors: FormErrors = {};
  
  if (formData.firstName && formData.firstName.length < 2) {
    errors.firstName = 'First Name must be at least 2 characters';
  } else if (formData.firstName && formData.firstName.length > 65) {
    errors.firstName = 'First Name must not exceed 65 characters';
  }
  
  if (!formData.lastName.trim()) {
    errors.lastName = 'Last Name is required';
  } else if (formData.lastName.length < 2) {
    errors.lastName = 'Last Name must be at least 2 characters';
  } else if (formData.lastName.length > 65) {
    errors.lastName = 'Last Name must not exceed 65 characters';
  }
  
  if (!formData.email.trim()) {
    errors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    errors.email = 'Please enter a valid email address';
  } else if (existingUsers.some(u => u.email.toLowerCase() === formData.email.toLowerCase())) {
    errors.email = 'A user with this email already exists';
  }
  
  if (!formData.loginName.trim()) {
    errors.loginName = 'Login Name is required';
  }
  
  if (!formData.userType.trim()) {
    errors.userType = 'User Type is required';
  }
  
  return errors;
};

export const validateGroupForm = (
  formData: { name: string; displayName: string },
  existingGroups: Group[]
): FormErrors => {
  const errors: FormErrors = {};
  
  if (!formData.name.trim()) {
    errors.name = 'Name is required';
  } else if (formData.name.length < 3) {
    errors.name = 'Name must be at least 3 characters';
  } else if (existingGroups.some(g => g.name.toLowerCase() === formData.name.toLowerCase())) {
    errors.name = 'A group with this name already exists';
  }
  
  if (!formData.displayName.trim()) {
    errors.displayName = 'Display Name is required';
  } else if (formData.displayName.length < 3) {
    errors.displayName = 'Display Name must be at least 3 characters';
  }
  
  return errors;
};

export const validateField = (
  field: string,
  value: string,
  formType: 'user' | 'group',
  existingData: User[] | Group[]
): string | undefined => {
  if (formType === 'user') {
    switch(field) {
      case 'firstName':
        if (value && value.length < 2) return 'First Name must be at least 2 characters';
        if (value && value.length > 65) return 'First Name must not exceed 65 characters';
        break;
      case 'lastName':
        if (!value.trim()) return 'Last Name is required';
        if (value.length < 2) return 'Last Name must be at least 2 characters';
        if (value.length > 65) return 'Last Name must not exceed 65 characters';
        break;
      case 'email':
        if (!value.trim()) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email address';
        if ((existingData as User[]).some(u => u.email.toLowerCase() === value.toLowerCase())) {
          return 'A user with this email already exists';
        }
        break;
      case 'status':
        if (!value || !value.trim()) return 'Status is required';
        if (!['Active', 'Inactive'].includes(value)) return 'Status must be Active or Inactive';
        break;
      case 'loginName':
        if (!value.trim()) return 'Login Name is required';
        break;
      case 'userType':
        if (!value.trim()) return 'User Type is required';
        break;
    }
  } else {
    switch(field) {
      case 'name':
        if (!value.trim()) return 'Name is required';
        if (value.length < 3) return 'Name must be at least 3 characters';
        if ((existingData as Group[]).some(g => g.name.toLowerCase() === value.toLowerCase())) {
          return 'A group with this name already exists';
        }
        break;
      case 'displayName':
        if (!value.trim()) return 'Display Name is required';
        if (value.length < 3) return 'Display Name must be at least 3 characters';
        break;
    }
  }
  return undefined;
};
