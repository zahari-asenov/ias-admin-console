import { useState, useEffect } from 'react';
import type { User } from '../types';

// Capitalize user type (backend may send lowercase, e.g. "employee" -> "Employee")
const capitalizeUserType = (str: string): string => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// Parse date to ISO 8601 for backend (YYYY-MM-DD -> YYYY-MM-DDTHH:mm:ssZ, empty -> undefined)
const toDateTimeIso = (value: string | undefined): string | undefined => {
  if (!value || typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  // Already full ISO (has 'T') - pass through
  if (trimmed.includes('T')) return trimmed;
  // Date-only YYYY-MM-DD - append midnight UTC
  if (trimmed.length === 10) return `${trimmed}T00:00:00Z`;
  return trimmed;
};

// Map API response to User type
const mapApiUserToUser = (apiUser: any): User => {
  // The ID from the response is the SCIM ID (set by backend)
  const scimId = apiUser.ID || apiUser.id || String(apiUser.ID || apiUser.id || '');
  
  return {
    id: scimId,  // SCIM ID is the id
    lastName: apiUser.lastName || '',
    email: apiUser.email || '',
    userType: capitalizeUserType(apiUser.userType || ''),
    loginName: apiUser.loginName || '',
    status: apiUser.status || '',
    firstName: apiUser.firstName,
    validFrom: apiUser.validFrom,
    validTo: apiUser.validTo,
    company: apiUser.company,
    country: apiUser.country,
    city: apiUser.city,
  };
};

// Map User type to API format (for POST - excludes ID)
const mapUserToApiUserForCreate = (user: Partial<User>): any => {
  return {
    // Don't include ID - it comes from the response
    lastName: user.lastName,
    email: user.email,
    userType: user.userType,
    loginName: user.loginName,
    status: user.status,
    firstName: user.firstName,
    validFrom: toDateTimeIso(user.validFrom),
    validTo: toDateTimeIso(user.validTo),
    company: user.company,
    country: user.country,
    city: user.city,
  };
};

// Map User type to API format (for PATCH - includes ID)
const mapUserToApiUser = (user: User): any => {
  return {
    ID: user.id,  // id is the SCIM ID
    lastName: user.lastName,
    email: user.email,
    userType: user.userType,
    loginName: user.loginName,
    status: user.status,
    firstName: user.firstName,
    validFrom: toDateTimeIso(user.validFrom),
    validTo: toDateTimeIso(user.validTo),
    company: user.company,
    country: user.country,
    city: user.city,
  };
};

const API_BASE_URL = '/odata/v4/IasReplicaService';

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch users from API
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/Users`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      const fetchedUsers = (data.value || []).map(mapApiUserToUser);
      setUsers(fetchedUsers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  // Load users on mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const addUser = async (user: Partial<User>) => {
    try {
      // For POST, don't include ID - it comes from the response
      const apiUser = mapUserToApiUserForCreate(user);
      const requestBody = JSON.stringify(apiUser);
      
      const response = await fetch(`${API_BASE_URL}/Users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: requestBody,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const createdUser = await response.json();
      const mappedUser = mapApiUserToUser(createdUser);
      setUsers([...users, mappedUser]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
      throw err;
    }
  };

  const updateUser = async (updatedUser: User) => {
    try {
      const apiUser = mapUserToApiUser(updatedUser);
      const response = await fetch(`${API_BASE_URL}/Users(${updatedUser.id})`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiUser),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
      throw err;
    }
  };

  const deleteUsers = async (userIds: string[]) => {
    try {
      // Delete users one by one (OData doesn't support bulk delete by default)
      await Promise.all(
        userIds.map(userId =>
          fetch(`${API_BASE_URL}/Users(${userId})`, {
            method: 'DELETE',
          }).then(response => {
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
          })
        )
      );

      setUsers(users.filter(u => !userIds.includes(u.id)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete users');
      throw err;
    }
  };

  return {
    users,
    loading,
    error,
    addUser,
    updateUser,
    deleteUsers,
    refetch: fetchUsers
  };
};
