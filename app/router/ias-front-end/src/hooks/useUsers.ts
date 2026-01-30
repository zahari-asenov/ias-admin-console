import { useState, useEffect } from 'react';
import type { User } from '../types';

// Map API response to User type
const mapApiUserToUser = (apiUser: any): User => {
  return {
    id: apiUser.ID || apiUser.id || String(apiUser.ID),
    lastName: apiUser.lastName || '',
    email: apiUser.email || '',
    userType: apiUser.userType || '',
    loginName: apiUser.loginName || '',
    status: apiUser.status || '',
    userId: apiUser.userId,
    firstName: apiUser.firstName,
    validFrom: apiUser.validFrom,
    validTo: apiUser.validTo,
    company: apiUser.company,
    country: apiUser.country,
    city: apiUser.city,
    scimId: apiUser.scimId || apiUser.scimID || '',
    globalUserId: apiUser.globalUserId || apiUser.globalUserID || ''
  };
};

// Map User type to API format
const mapUserToApiUser = (user: User): any => {
  return {
    ID: user.id,
    lastName: user.lastName,
    email: user.email,
    userType: user.userType,
    loginName: user.loginName,
    status: user.status,
    userId: user.userId,
    firstName: user.firstName,
    validFrom: user.validFrom,
    validTo: user.validTo,
    company: user.company,
    country: user.country,
    city: user.city,
    scimId: user.scimId,
    globalUserId: user.globalUserId
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
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load users on mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const addUser = async (user: User) => {
    try {
      const apiUser = mapUserToApiUser(user);
      const response = await fetch(`${API_BASE_URL}/Users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiUser),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const createdUser = await response.json();
      const mappedUser = mapApiUserToUser(createdUser);
      setUsers([...users, mappedUser]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
      console.error('Error creating user:', err);
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
      console.error('Error updating user:', err);
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
      console.error('Error deleting users:', err);
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
