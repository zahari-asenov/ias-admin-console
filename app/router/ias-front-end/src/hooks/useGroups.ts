import { useState, useEffect } from 'react';
import type { Group, User } from '../types';

// Map API response to Group type
const mapApiGroupToGroup = (apiGroup: any): Group => {
  return {
    id: apiGroup.ID || apiGroup.id || String(apiGroup.ID),
    name: apiGroup.name || '',
    displayName: apiGroup.displayName || apiGroup.display_name || '',
    description: apiGroup.description || '',
    scimId: apiGroup.scimId || apiGroup.scimID || '',
    groupId: apiGroup.groupId || apiGroup.groupID || '',
    type: apiGroup.type || '',
    source: apiGroup.source || '',
    memberCount: apiGroup.memberCount || apiGroup.member_count || 0,
    createdDate: apiGroup.createdDate || apiGroup.created_date,
    modifiedDate: apiGroup.modifiedDate || apiGroup.modified_date,
    owner: apiGroup.owner,
    application: apiGroup.application,
    status: apiGroup.status
  };
};

// Map Group type to API format
const mapGroupToApiGroup = (group: Group): any => {
  return {
    ID: group.id,
    name: group.name,
    displayName: group.displayName,
    description: group.description,
    scimId: group.scimId,
    groupId: group.groupId,
    type: group.type,
    source: group.source,
    memberCount: group.memberCount,
    createdDate: group.createdDate,
    modifiedDate: group.modifiedDate,
    owner: group.owner,
    application: group.application,
    status: group.status
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
      const response = await fetch(`${API_BASE_URL}/Groups`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      const fetchedGroups = (data.value || []).map(mapApiGroupToGroup);
      setGroups(fetchedGroups);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch groups');
      console.error('Error fetching groups:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch members for a specific group
  const fetchGroupMembers = async (groupId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/Groups(${groupId})/Members`);
      
      if (!response.ok) {
        // If endpoint doesn't exist, return empty array
        if (response.status === 404) {
          return [];
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      const members = (data.value || []).map((apiUser: any) => ({
        id: apiUser.ID || apiUser.id || String(apiUser.ID),
        lastName: apiUser.lastName || '',
        email: apiUser.email || '',
        userType: apiUser.userType || '',
        loginName: apiUser.loginName || '',
        status: apiUser.status || '',
        userId: apiUser.userId,
        firstName: apiUser.firstName,
        company: apiUser.company,
        city: apiUser.city,
        country: apiUser.country,
        scimId: apiUser.scimId || apiUser.scimID || '',
        globalUserId: apiUser.globalUserId || apiUser.globalUserID || ''
      }));
      
      setGroupMembers(prev => ({
        ...prev,
        [groupId]: members
      }));
      
      return members;
    } catch (err) {
      console.error('Error fetching group members:', err);
      return [];
    }
  };

  // Load groups on mount
  useEffect(() => {
    fetchGroups();
  }, []);

  const addGroup = async (group: Group) => {
    try {
      const apiGroup = mapGroupToApiGroup(group);
      const response = await fetch(`${API_BASE_URL}/Groups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiGroup),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const createdGroup = await response.json();
      const mappedGroup = mapApiGroupToGroup(createdGroup);
      setGroups([...groups, mappedGroup]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create group');
      console.error('Error creating group:', err);
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
      console.error('Error updating group:', err);
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
      console.error('Error deleting groups:', err);
      throw err;
    }
  };

  const addUsersToGroup = async (groupId: string, users: User[]) => {
    try {
      // Add users to group via API
      await Promise.all(
        users.map(user =>
          fetch(`${API_BASE_URL}/Groups(${groupId})/Members`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ID: user.id }),
          }).then(response => {
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
          })
        )
      );

      // Refresh group members and get the updated count
      const updatedMembers = await fetchGroupMembers(groupId);

      // Update member count
      const group = groups.find(g => g.id === groupId);
      if (group) {
        await updateGroup({
          ...group,
          memberCount: updatedMembers.length
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add users to group');
      console.error('Error adding users to group:', err);
      throw err;
    }
  };

  const removeUserFromGroup = async (groupId: string, userId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/Groups(${groupId})/Members(${userId})`, {
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

      const group = groups.find(g => g.id === groupId);
      if (group) {
        await updateGroup({
          ...group,
          memberCount: Math.max(0, group.memberCount - 1)
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove user from group');
      console.error('Error removing user from group:', err);
      throw err;
    }
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
    refetch: fetchGroups
  };
};
