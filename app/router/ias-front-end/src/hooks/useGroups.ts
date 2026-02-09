import { useState, useEffect } from 'react';
import type { Group, User } from '../types';

// Map API response to Group type
const mapApiGroupToGroup = (apiGroup: any): Group => {
  // The ID from the response is the SCIM ID (set by backend)
  const scimId = apiGroup.ID || apiGroup.id || String(apiGroup.ID || apiGroup.id || '');
  
  return {
    id: scimId,  // SCIM ID is the id
    name: apiGroup.name || '',
    displayName: apiGroup.displayName || apiGroup.display_name || '',
    description: apiGroup.description || '',
  };
};

// Map Group type to API format (for POST - excludes ID)
const mapGroupToApiGroupForCreate = (group: Partial<Group>): any => {
  return {
    // Don't include ID - it comes from the response
    name: group.name,
    displayName: group.displayName,
    description: group.description,
  };
};

// Map Group type to API format (for PATCH - includes ID, excludes immutable name)
const mapGroupToApiGroup = (group: Group): any => {
  return {
    ID: group.id,  // id is the SCIM ID
    // Don't send name - it's immutable per schema
    displayName: group.displayName,
    description: group.description,
  };
};

const API_BASE_URL = '/odata/v4/IasReplicaService';

export const useGroups = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupMembers, setGroupMembers] = useState<{ [groupId: string]: User[] }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch groups from API
  const fetchGroups = async () => {
    try {
      setLoading(true);
      setError(null);
      const url = `${API_BASE_URL}/Groups`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      const fetchedGroups = (data.value || []).map(mapApiGroupToGroup);
      setGroups(fetchedGroups);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch groups');
    } finally {
      setLoading(false);
    }
  };

  // Fetch members for a specific group
  const fetchGroupMembers = async (groupId: string) => {
    console.log('=== fetchGroupMembers START ===');
    console.log('Step 1: Starting to fetch group members for group ID:', groupId);
    
    try {
      // Step 2: Build the GroupMembers endpoint URL
      const url = `${API_BASE_URL}/Groups/${groupId}/members`;
      console.log('Step 2: Built GroupMembers URL:', url);
      console.log('Step 2: Full URL:', window.location.origin + url);
      
      // Step 3: Fetch GroupMembers
      console.log('Step 3: Making request to fetch GroupMembers...');
      const response = await fetch(url);
      console.log('Step 3: Response received. Status:', response.status, 'OK:', response.ok);
      
      if (!response.ok) {
        if (response.status === 404) {
          console.log('Step 3: Endpoint not found (404), returning empty array');
          return [];
        }
        const errorText = await response.text();
        console.log('Step 3: Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Step 4: Parse GroupMembers response
      console.log('Step 4: Parsing GroupMembers JSON response...');
      const data = await response.json();
      console.log('Step 4: GroupMembers response:', JSON.stringify(data, null, 2));
      console.log('Step 4: Number of GroupMembers found:', data.value?.length || 0);
      
      // Step 5: Extract user IDs
      console.log('Step 5: Extracting user IDs from GroupMembers...');
      const userIds = (data.value || []).map((membership: any) => 
        membership.user_ID
      ).filter(Boolean);
      console.log('Step 5: Extracted user IDs:', userIds);
      console.log('Step 5: Number of users to fetch:', userIds.length);
      
      if (userIds.length === 0) {
        console.log('Step 5: No users found, updating state with empty array');
        setGroupMembers(prev => ({
          ...prev,
          [groupId]: []
        }));
        console.log('=== fetchGroupMembers END (no users) ===');
        return [];
      }
      
      // Step 6: Fetch each user individually
      console.log('Step 6: Starting to fetch', userIds.length, 'users individually...');
      const userPromises = userIds.map(async (userId: string, index: number) => {
        console.log(`Step 6.${index + 1}: Fetching user ${index + 1}/${userIds.length} - ID: ${userId}`);
        try {
          const userUrl = `${API_BASE_URL}/Users/${userId}`;
          console.log(`Step 6.${index + 1}: User URL:`, userUrl);
          console.log(`Step 6.${index + 1}: Full URL:`, window.location.origin + userUrl);
          
          console.log(`Step 6.${index + 1}: Making request...`);
          const userResponse = await fetch(userUrl);
          console.log(`Step 6.${index + 1}: Response received. Status:`, userResponse.status, 'OK:', userResponse.ok);
          
          if (!userResponse.ok) {
            console.log(`Step 6.${index + 1}: Failed to fetch user ${userId}, status:`, userResponse.status);
            return null;
          }
          
          console.log(`Step 6.${index + 1}: Parsing user JSON response...`);
          const userData = await userResponse.json();
          console.log(`Step 6.${index + 1}: User data received:`, JSON.stringify(userData, null, 2));
          
          // Map the user data
          console.log(`Step 6.${index + 1}: Mapping user data...`);
          const scimId = userData.ID || userData.id || String(userData.ID || userData.id || '');
          const userType = (userData.userType || '').charAt(0).toUpperCase() + (userData.userType || '').slice(1).toLowerCase();
          const mappedUser = {
            id: scimId,
            lastName: userData.lastName || '',
            email: userData.email || '',
            userType,
            loginName: userData.loginName || '',
            status: userData.status || '',
            firstName: userData.firstName,
            validFrom: userData.validFrom,
            validTo: userData.validTo,
            company: userData.company,
            country: userData.country,
            city: userData.city,
          };
          console.log(`Step 6.${index + 1}: Mapped user:`, JSON.stringify(mappedUser, null, 2));
          console.log(`Step 6.${index + 1}: Successfully fetched user ${userId}`);
          return mappedUser;
        } catch (err) {
          console.log(`Step 6.${index + 1}: Error fetching user ${userId}:`, err);
          return null;
        }
      });
      
      // Step 7: Wait for all user fetches
      console.log('Step 7: Waiting for all user fetches to complete...');
      const users = await Promise.all(userPromises);
      console.log('Step 7: All user fetches completed. Results:', users);
      
      // Step 8: Filter out null values
      console.log('Step 8: Filtering out failed fetches (null values)...');
      const validUsers = users.filter((u): u is User => u !== null);
      console.log('Step 8: Valid users count:', validUsers.length);
      console.log('Step 8: Valid users:', JSON.stringify(validUsers, null, 2));
      
      // Step 9: Update state
      console.log('Step 9: Updating groupMembers state...');
      setGroupMembers(prev => {
        const updated = {
          ...prev,
          [groupId]: validUsers
        };
        console.log('Step 9: State updated. New groupMembers:', JSON.stringify(updated, null, 2));
        return updated;
      });
      
      console.log('Step 10: Returning', validUsers.length, 'users');
      console.log('=== fetchGroupMembers END (success) ===');
      return validUsers;
    } catch (err) {
      console.log('=== fetchGroupMembers ERROR ===');
      console.log('Error:', err);
      console.log('=== fetchGroupMembers END (error) ===');
      return [];
    }
  };

  // Load groups on mount
  useEffect(() => {
    fetchGroups();
  }, []);

  // Fetch all group members after groups are loaded
  useEffect(() => {
    if (groups.length > 0) {
      console.log('=== Fetching members for all groups at startup ===');
      console.log('Total groups to fetch:', groups.length);
      groups.forEach((group, index) => {
        console.log(`Fetching members for group ${index + 1}/${groups.length}: ${group.name} (${group.id})`);
        fetchGroupMembers(group.id);
      });
    }
  }, [groups]);

  const addGroup = async (group: Partial<Group>) => {
    try {
      // For POST, don't include ID - it comes from the response
      const apiGroup = mapGroupToApiGroupForCreate(group);
      const requestBody = JSON.stringify(apiGroup);
      
      const response = await fetch(`${API_BASE_URL}/Groups`, {
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

      const createdGroup = await response.json();
      const mappedGroup = mapApiGroupToGroup(createdGroup);
      setGroups([...groups, mappedGroup]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create group');
      throw err;
    }
  };

  const updateGroup = async (updatedGroup: Group) => {
    try {
      const apiGroup = mapGroupToApiGroup(updatedGroup);
      const response = await fetch(`${API_BASE_URL}/Groups(${updatedGroup.id})`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiGroup),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setGroups(groups.map(g => g.id === updatedGroup.id ? updatedGroup : g));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update group');
      throw err;
    }
  };

  const deleteGroups = async (groupIds: string[]) => {
    try {
      // Delete groups one by one (OData doesn't support bulk delete by default)
      await Promise.all(
        groupIds.map(groupId =>
          fetch(`${API_BASE_URL}/Groups(${groupId})`, {
            method: 'DELETE',
          }).then(response => {
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
          })
        )
      );

      setGroups(groups.filter(g => !groupIds.includes(g.id)));
      const newGroupMembers = { ...groupMembers };
      groupIds.forEach(id => delete newGroupMembers[id]);
      setGroupMembers(newGroupMembers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete groups');
      throw err;
    }
  };

  const addUsersToGroup = async (groupId: string, users: User[]) => {
    try {
      // Add users to group via API - POST directly to GroupMembers entity
      await Promise.all(
        users.map(user => {
          const requestBody = JSON.stringify({
            group_ID: groupId,
            user_ID: user.id
          });
          
          return fetch(`${API_BASE_URL}/GroupMembers`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: requestBody,
          }).then(async response => {
            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }
            const responseData = await response.json();
            return responseData;
          });
        })
      );

      // Immediately update groupMembers with the full user objects we have
      setGroupMembers(prev => {
        const currentMembers = prev[groupId] || [];
        const existingIds = new Set(currentMembers.map(u => u.id));
        
        // Add new users that aren't already in the list
        const newUsers = users.filter(u => !existingIds.has(u.id));
        const updatedMembers = [...currentMembers, ...newUsers];
        
        return {
          ...prev,
          [groupId]: updatedMembers
        };
      });

      // Also refresh from API to ensure we have the latest data
      await fetchGroupMembers(groupId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add users to group');
      throw err;
    }
  };

  const removeUserFromGroup = async (groupId: string, userId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/GroupMembers/${userId}/${groupId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const currentMembers = groupMembers[groupId] || [];
      setGroupMembers({
        ...groupMembers,
        [groupId]: currentMembers.filter(u => u.id !== userId)
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove user from group');
      throw err;
    }
  };

  // Remove deleted users from all groupMembers
  const removeDeletedUsersFromGroups = (userIds: string[]) => {
    const updatedGroupMembers: { [groupId: string]: User[] } = {};
    Object.keys(groupMembers).forEach(groupId => {
      updatedGroupMembers[groupId] = groupMembers[groupId].filter(user => 
        !userIds.includes(user.id)
      );
    });
    setGroupMembers(updatedGroupMembers);
  };

  // Update user in all groupMembers where they appear (e.g. after user edit)
  const updateUserInGroupMembers = (updatedUser: User) => {
    const updatedGroupMembers: { [groupId: string]: User[] } = {};
    Object.keys(groupMembers).forEach(groupId => {
      updatedGroupMembers[groupId] = groupMembers[groupId].map(user =>
        user.id === updatedUser.id ? updatedUser : user
      );
    });
    setGroupMembers(updatedGroupMembers);
  };

  return {
    groups,
    groupMembers,
    loading,
    error,
    addGroup,
    updateGroup,
    deleteGroups,
    addUsersToGroup,
    removeUserFromGroup,
    fetchGroupMembers,
    removeDeletedUsersFromGroups,
    updateUserInGroupMembers,
    refetch: fetchGroups
  };
};
