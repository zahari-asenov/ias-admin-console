export type ViewType = 'users' | 'groups';

export interface User {
  id: string;  // SCIM ID from the backend response
  // Required fields
  lastName: string;
  email: string;
  userType: string;
  loginName: string;
  status: string;
  // Optional fields
  firstName?: string;
  validFrom?: string;
  validTo?: string;
  company?: string;
  country?: string;
  city?: string;
}

export interface Group {
  id: string;  // SCIM ID from the backend response
  name: string;
  displayName: string;
  description: string;
}

export interface UserFormData {
  firstName: string;
  lastName: string;
  email: string;
  loginName: string;
  userType: string;
}

export interface GroupFormData {
  name: string;
  displayName: string;
  description: string;
}

export interface FormErrors {
  [key: string]: string;
}
