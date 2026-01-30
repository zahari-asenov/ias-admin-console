export type ViewType = 'users' | 'groups';

export interface User {
  id: string;
  // Required fields
  lastName: string;
  email: string;
  userType: string;
  loginName: string;
  status: string;
  // Optional fields
  userId?: string;
  firstName?: string;
  validFrom?: string;
  validTo?: string;
  company?: string;
  country?: string;
  city?: string;
  // System fields (kept for backwards compatibility)
  scimId: string;
  globalUserId: string;
}

export interface Group {
  id: string;
  name: string;
  displayName: string;
  description: string;
  scimId: string;
  groupId: string;
  type: string;
  source: string;
  memberCount: number;
  createdDate?: string;
  modifiedDate?: string;
  owner?: string;
  application?: string;
  status?: string;
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
  groupId?: string;
}

export interface FormErrors {
  [key: string]: string;
}
