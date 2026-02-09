import { useState, useEffect } from 'react';
import { Container, Stack, Group as MantineGroup, Button, Paper } from '@mantine/core';
import type { ViewType, User, Group } from './types';
import { useUsers } from './hooks/useUsers';
import { useGroups } from './hooks/useGroups';
import { useSelection } from './hooks/useSelection';
import { SearchBar } from './components/common/SearchBar';
import { UserTable } from './components/users/UserTable';
import { GroupTable } from './components/groups/GroupTable';
import { UserDetailPanel } from './components/users/UserDetailPanel';
import { GroupDetailPanel } from './components/groups/GroupDetailPanel';
import { CreateUserModal } from './components/users/CreateUserModal';
import { CreateGroupModal } from './components/groups/CreateGroupModal';
import { AddUsersModal } from './components/groups/AddUsersModal';
import { AssignGroupsModal } from './components/users/AssignGroupsModal';
import { DeleteConfirmationModal } from './components/common/DeleteConfirmationModal';

function App() {
  // ============================================
  // HELPER FUNCTIONS FOR LOCALSTORAGE
  // ============================================
  
  // Helper to get initial state from localStorage
  const getInitialViewType = (): ViewType => {
    try {
      const saved = localStorage.getItem('app-viewType');
      return (saved === 'users' || saved === 'groups') ? saved : 'users';
    } catch {
      return 'users';
    }
  };

  const getInitialSelectedUserId = (): string | null => {
    try {
      return localStorage.getItem('app-selectedUserId');
    } catch {
      return null;
    }
  };

  const getInitialSelectedGroupId = (): string | null => {
    try {
      return localStorage.getItem('app-selectedGroupId');
    } catch {
      return null;
    }
  };

  // ============================================
  // STATE MANAGEMENT
  // ============================================
  
  // View state: which tab is active (users or groups) - persisted
  const [viewType, setViewTypeState] = useState<ViewType>(getInitialViewType());
  const setViewType = (newViewType: ViewType) => {
    setViewTypeState(newViewType);
    try {
      localStorage.setItem('app-viewType', newViewType);
    } catch (e) {
      console.error('Failed to save viewType to localStorage', e);
    }
  };
  
  // Search state: what the user is searching for
  const [searchTerm, setSearchTerm] = useState('');
  
  // Selection state: which user/group is currently selected (for detail panel) - persisted by ID
  const [selectedUserId, setSelectedUserIdState] = useState<string | null>(getInitialSelectedUserId());
  const [selectedGroupId, setSelectedGroupIdState] = useState<string | null>(getInitialSelectedGroupId());
  
  // Actual selected objects (will be restored after data loads)
  const [selectedUser, setSelectedUserState] = useState<User | null>(null);
  const [selectedGroup, setSelectedGroupState] = useState<Group | null>(null);
  
  // Wrapper functions to update selection and persist
  const setSelectedUser = (user: User | null) => {
    setSelectedUserState(user);
    try {
      if (user) {
        localStorage.setItem('app-selectedUserId', user.id);
        setSelectedUserIdState(user.id);
      } else {
        localStorage.removeItem('app-selectedUserId');
        setSelectedUserIdState(null);
      }
    } catch (e) {
      console.error('Failed to save selectedUserId to localStorage', e);
    }
  };
  
  const setSelectedGroup = (group: Group | null) => {
    setSelectedGroupState(group);
    try {
      if (group) {
        localStorage.setItem('app-selectedGroupId', group.id);
        setSelectedGroupIdState(group.id);
      } else {
        localStorage.removeItem('app-selectedGroupId');
        setSelectedGroupIdState(null);
      }
    } catch (e) {
      console.error('Failed to save selectedGroupId to localStorage', e);
    }
  };
  
  // Modal visibility state: which modals are open
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showAddGroupModal, setShowAddGroupModal] = useState(false);
  const [showAddUsersModal, setShowAddUsersModal] = useState(false);
  const [showAssignGroupsModal, setShowAssignGroupsModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [deleteType, setDeleteType] = useState<'users' | 'groups'>('users');
  
  // Modal context state: which entity the modal is working with
  const [addUsersGroupId, setAddUsersGroupId] = useState<string | null>(null);
  const [assignGroupsUserId, setAssignGroupsUserId] = useState<string | null>(null);
  
  // User-Group relationship: tracks which groups each user belongs to
  const [userGroups, setUserGroups] = useState<{ [userId: string]: Group[] }>({});

  // ============================================
  // DATA HOOKS (get data and CRUD operations)
  // ============================================
  const { users, loading: usersLoading, error: usersError, addUser, updateUser, deleteUsers } = useUsers();
  const { groups, groupMembers, loading: groupsLoading, error: groupsError, addGroup, updateGroup, deleteGroups, addUsersToGroup, removeUserFromGroup, removeDeletedUsersFromGroups } = useGroups();
  const { selectedIds, toggleSelection, clearSelection, toggleSelectAll } = useSelection();

  // ============================================
  // SYNC USER GROUPS FROM GROUP MEMBERS
  // ============================================
  // Derive userGroups from groupMembers to keep them in sync
  // This ensures that when groupMembers is updated (via API calls),
  // userGroups is automatically updated so the user modal shows the latest groups
  useEffect(() => {
    const userGroupsMap: { [userId: string]: Group[] } = {};
    
    // Build userGroups from groupMembers (inverse relationship)
    Object.keys(groupMembers).forEach(groupId => {
      const members = groupMembers[groupId];
      const group = groups.find(g => g.id === groupId);
      if (group) {
        members.forEach(user => {
          if (!userGroupsMap[user.id]) {
            userGroupsMap[user.id] = [];
          }
          // Only add if not already in the list
          if (!userGroupsMap[user.id].find(g => g.id === groupId)) {
            userGroupsMap[user.id].push(group);
          }
        });
      }
    });
    
    // Update userGroups state, but preserve any manually added groups
    // that might not be in groupMembers yet (during assignment operations)
    setUserGroups(prev => {
      const merged = { ...userGroupsMap };
      // Merge with existing data to preserve any groups that might not be in groupMembers yet
      Object.keys(prev).forEach(userId => {
        if (!merged[userId]) {
          merged[userId] = [];
        }
        // Add groups from prev that aren't in the new map
        // BUT only if the group still exists in the groups array
        prev[userId].forEach(group => {
          const groupStillExists = groups.find(g => g.id === group.id);
          if (groupStillExists && !merged[userId].find(g => g.id === group.id)) {
            merged[userId].push(group);
          }
        });
      });
      return merged;
    });
  }, [groupMembers, groups]);

  // ============================================
  // RESTORE SELECTED ITEMS AFTER DATA LOADS
  // ============================================
  
  // Restore selected user after data loads
  useEffect(() => {
    if (selectedUserId && users.length > 0) {
      const user = users.find(u => u.id === selectedUserId);
      if (user) {
        setSelectedUserState(user);
      } else {
        // User was deleted, clear selection
        setSelectedUserIdState(null);
        try {
          localStorage.removeItem('app-selectedUserId');
        } catch (e) {
          console.error('Failed to remove selectedUserId from localStorage', e);
        }
      }
    }
  }, [users, selectedUserId]);

  // Restore selected group after data loads
  useEffect(() => {
    if (selectedGroupId && groups.length > 0) {
      const group = groups.find(g => g.id === selectedGroupId);
      if (group) {
        setSelectedGroupState(group);
      } else {
        // Group was deleted, clear selection
        setSelectedGroupIdState(null);
        try {
          localStorage.removeItem('app-selectedGroupId');
        } catch (e) {
          console.error('Failed to remove selectedGroupId from localStorage', e);
        }
      }
    }
  }, [groups, selectedGroupId]);

  // ============================================
  // FILTERING LOGIC
  // ============================================
  
  // Filter users based on search term (searches multiple fields)
  const filteredUsers = users.filter(user => {
    if (searchTerm === '') return true; // Show all if no search term
    
    const lowerSearch = searchTerm.toLowerCase();
    return (
      user.lastName.toLowerCase().includes(lowerSearch) ||
      user.email.toLowerCase().includes(lowerSearch) ||
      user.loginName.toLowerCase().includes(lowerSearch) ||
      user.userType.toLowerCase().includes(lowerSearch) ||
      user.status.toLowerCase().includes(lowerSearch) ||
      (user.firstName && user.firstName.toLowerCase().includes(lowerSearch))
    );
  });

  // Filter groups based on search term (searches multiple fields)
  const filteredGroups = groups.filter(group => {
    if (searchTerm === '') return true; // Show all if no search term
    
    const lowerSearch = searchTerm.toLowerCase();
    return (
      group.id.toLowerCase().includes(lowerSearch) ||
      group.name.toLowerCase().includes(lowerSearch) ||
      group.displayName.toLowerCase().includes(lowerSearch) ||
      group.description.toLowerCase().includes(lowerSearch)
    );
  });

  // ============================================
  // EVENT HANDLERS - View Management
  // ============================================
  
  // When user switches between Users and Groups tabs
  const handleViewTypeChange = (newViewType: ViewType) => {
    setViewType(newViewType);
    setSearchTerm(''); // Clear search when switching views
    // Don't clear selections - let user keep their context across refreshes
    // clearSelection(); 
    // setSelectedUser(null);
    // setSelectedGroup(null);
  };

  // ============================================
  // EVENT HANDLERS - User Operations
  // ============================================
  
  // When user clicks on a user row (opens detail panel)
  const handleUserClick = (user: User) => {
    setSelectedUser(user);
  };

  // When user clicks checkbox on a user row
  const handleSelectUser = (userId: string) => {
    toggleSelection(userId);
  };

  // When user clicks "select all" checkbox in user table
  const handleSelectAllUsers = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      toggleSelectAll(filteredUsers.map(u => u.id));
    } else {
      clearSelection();
    }
  };

  // Delete selected users
  const handleDeleteUsers = () => {
    if (selectedIds.size === 0) return;
    
    setDeleteType('users');
    setShowDeleteConfirmModal(true);
  };

  // Confirm delete users (called from modal)
  const confirmDeleteUsers = async () => {
    try {
      const userIdsToDelete = Array.from(selectedIds);
      await deleteUsers(userIdsToDelete);
      removeDeletedUsersFromGroups(userIdsToDelete);
      clearSelection();
      // If the selected user was deleted, close the detail panel
      if (selectedUser && selectedIds.has(selectedUser.id)) {
        setSelectedUser(null);
      }
      setShowDeleteConfirmModal(false);
    } catch (err) {
      alert('Failed to delete users. Please try again.');
      setShowDeleteConfirmModal(false);
    }
  };

  // Update user (called from detail panel)
  const handleUpdateUser = async (updatedUser: User) => {
    try {
      await updateUser(updatedUser);
      setSelectedUser(updatedUser); // Update the selected user to show changes
    } catch (err) {
      alert('Failed to update user. Please try again.');
    }
  };

  // Create new user (called from create modal)
  const handleCreateUser = async (user: Partial<User>) => {
    try {
      await addUser(user);
    } catch (err) {
      alert('Failed to create user. Please try again.');
      throw err; // Re-throw so modal can handle it
    }
  };

  // ============================================
  // EVENT HANDLERS - Group Operations
  // ============================================
  
  // When user clicks on a group row (opens detail panel)
  const handleGroupClick = (group: Group) => {
    setSelectedGroup(group);
  };

  // When user clicks checkbox on a group row
  const handleSelectGroup = (groupId: string) => {
    toggleSelection(groupId);
  };

  // When user clicks "select all" checkbox in group table
  const handleSelectAllGroups = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      toggleSelectAll(filteredGroups.map(g => g.id));
    } else {
      clearSelection();
    }
  };

  // Delete selected groups
  const handleDeleteGroups = () => {
    if (selectedIds.size === 0) return;
    
    setDeleteType('groups');
    setShowDeleteConfirmModal(true);
  };

  // Confirm delete groups (called from modal)
  const confirmDeleteGroups = async () => {
    try {
      await deleteGroups(Array.from(selectedIds));
      clearSelection();
      // If the selected group was deleted, close the detail panel
      if (selectedGroup && selectedIds.has(selectedGroup.id)) {
        setSelectedGroup(null);
      }
      setShowDeleteConfirmModal(false);
    } catch (err) {
      alert('Failed to delete groups. Please try again.');
      setShowDeleteConfirmModal(false);
    }
  };

  // Update group (called from detail panel)
  const handleUpdateGroup = async (updatedGroup: Group) => {
    try {
      await updateGroup(updatedGroup);
      setSelectedGroup(updatedGroup); // Update the selected group to show changes
    } catch (err) {
      alert('Failed to update group. Please try again.');
    }
  };

  // Create new group (called from create modal)
  const handleCreateGroup = async (group: Partial<Group>) => {
    try {
      await addGroup(group);
    } catch (err) {
      alert('Failed to create group. Please try again.');
      throw err; // Re-throw so modal can handle it
    }
  };

  // ============================================
  // EVENT HANDLERS - User-Group Relationships
  // ============================================
  
  // Open modal to add users to a group
  const handleOpenAddUsers = (groupId: string) => {
    setAddUsersGroupId(groupId);
    setShowAddUsersModal(true);
  };

  // Add users to a group (called from AddUsersModal)
  const handleAddUsersToGroup = async (groupId: string, userIds: string[]) => {
    try {
      // Add users to the group's member list
      const usersToAdd = users.filter(u => userIds.includes(u.id));
      await addUsersToGroup(groupId, usersToAdd);
      
      // Also update userGroups to maintain bidirectional relationship
      // (so we can see which groups a user belongs to)
      const groupToAdd = groups.find(g => g.id === groupId);
      if (groupToAdd) {
        setUserGroups(prev => {
          const updated = { ...prev };
          userIds.forEach(userId => {
            const currentGroups = updated[userId] || [];
            const existingIds = new Set(currentGroups.map(g => g.id));
            // Only add if not already in the list
            if (!existingIds.has(groupId)) {
              updated[userId] = [...currentGroups, groupToAdd];
            }
          });
          return updated;
        });
      }
    } catch (err) {
      alert('Failed to add users to group. Please try again.');
    }
  };

  // Remove a user from a group (called from GroupDetailPanel)
  const handleRemoveUserFromGroup = async (groupId: string, userId: string) => {
    try {
      // Remove from group's member list
      await removeUserFromGroup(groupId, userId);
      
      // Also remove from userGroups to maintain bidirectional relationship
      setUserGroups(prev => {
        const updated = { ...prev };
        if (updated[userId]) {
          updated[userId] = updated[userId].filter(g => g.id !== groupId);
        }
        return updated;
      });
    } catch (err) {
      alert('Failed to remove user from group. Please try again.');
    }
  };

  // Open modal to assign groups to a user
  const handleOpenAssignGroups = (userId: string) => {
    setAssignGroupsUserId(userId);
    setShowAssignGroupsModal(true);
  };

  // Assign groups to a user (called from AssignGroupsModal)
  const handleAssignGroupsToUser = async (userId: string, groupIds: string[]) => {
    try {
      // Update userGroups to show which groups this user belongs to
      const groupsToAssign = groups.filter(g => groupIds.includes(g.id));
      setUserGroups(prev => {
        const currentGroups = prev[userId] || [];
        const existingIds = new Set(currentGroups.map(g => g.id));
        // Only add groups that aren't already assigned
        const newGroups = groupsToAssign.filter(g => !existingIds.has(g.id));
        return {
          ...prev,
          [userId]: [...currentGroups, ...newGroups]
        };
      });
      
      // Also add user to each group's member list (bidirectional relationship)
      const user = users.find(u => u.id === userId);
      if (user) {
        await Promise.all(
          groupIds.map(groupId => addUsersToGroup(groupId, [user]))
        );
      }
    } catch (err) {
      alert('Failed to assign groups to user. Please try again.');
    }
  };

  // Unassign a group from a user (called from UserDetailPanel)
  const handleUnassignGroupFromUser = async (userId: string, groupId: string) => {
    try {
      // Remove from userGroups
      setUserGroups(prev => {
        const updated = { ...prev };
        if (updated[userId]) {
          updated[userId] = updated[userId].filter(g => g.id !== groupId);
        }
        return updated;
      });
      
      // Also remove user from group's member list (bidirectional relationship)
      await removeUserFromGroup(groupId, userId);
    } catch (err) {
      alert('Failed to unassign group from user. Please try again.');
    }
  };

  // ============================================
  // COMPUTED VALUES (for modals)
  // ============================================
  
  // Get current members of the group being edited (for AddUsersModal)
  const currentMembers = addUsersGroupId ? (groupMembers[addUsersGroupId] || []) : [];
  
  // Get current groups of the user being edited (for AssignGroupsModal)
  const currentUserGroups = assignGroupsUserId ? (userGroups[assignGroupsUserId] || []) : [];

  // ============================================
  // RENDER
  // ============================================
  return (
    <div style={{ display: 'flex', minHeight: '100vh', position: 'relative' }}>
      {/* Main content area */}
      <Container size="xl" style={{ flex: 1, margin: 'clamp(20px, 4vh, 40px) auto', padding: '0 clamp(12px, 2vw, 20px)', transition: 'margin-right 0.3s ease' }}>
        <Stack gap="md">
          {/* Search bar and view switcher */}
          <SearchBar
            viewType={viewType}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onViewTypeChange={handleViewTypeChange}
          />

          {/* Loading and Error States */}
          {(viewType === 'users' ? usersLoading : groupsLoading) && (
            <Paper p="md" withBorder>
              <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                Loading {viewType}...
              </div>
            </Paper>
          )}

          {(viewType === 'users' ? usersError : groupsError) && (
            <Paper p="md" withBorder style={{ background: '#fee', color: '#c33' }}>
              <div style={{ padding: '15px' }}>
                Error: {viewType === 'users' ? usersError : groupsError}
              </div>
            </Paper>
          )}

          {/* Action buttons (Add, Delete) */}
          <Paper p="md" withBorder>
            <MantineGroup gap="sm">
              <Button 
                onClick={() => viewType === 'users' ? setShowAddUserModal(true) : setShowAddGroupModal(true)}
              >
                Add
              </Button>
              <Button 
                color="red"
                onClick={viewType === 'users' ? handleDeleteUsers : handleDeleteGroups}
                disabled={selectedIds.size === 0}
              >
                Delete 
              </Button>
            </MantineGroup>
          </Paper>

          {/* Table view - shows users or groups based on viewType */}
          {!(viewType === 'users' ? usersLoading : groupsLoading) && (
            viewType === 'users' ? (
              <UserTable
                users={filteredUsers}
                selectedIds={selectedIds}
                selectedUserId={selectedUser?.id}
                onSelectAll={handleSelectAllUsers}
                onSelectUser={handleSelectUser}
                onUserClick={handleUserClick}
              />
            ) : (
              <GroupTable
                groups={filteredGroups}
                selectedIds={selectedIds}
                selectedGroupId={selectedGroup?.id}
                onSelectAll={handleSelectAllGroups}
                onSelectGroup={handleSelectGroup}
                onGroupClick={handleGroupClick}
              />
            )
          )}
        </Stack>
      </Container>

      {/* Detail panels - show when a user or group is selected */}
      {viewType === 'users' && selectedUser && (
        <UserDetailPanel
          user={selectedUser}
          allUsers={users}
          allGroups={groups}
          userGroups={userGroups}
          onClose={() => setSelectedUser(null)}
          onUpdate={handleUpdateUser}
          onOpenAssignGroups={handleOpenAssignGroups}
          onUnassignGroupFromUser={handleUnassignGroupFromUser}
        />
      )}

      {viewType === 'groups' && selectedGroup && (
        <GroupDetailPanel
          group={selectedGroup}
          allGroups={groups}
          groupMembers={groupMembers}
          onClose={() => setSelectedGroup(null)}
          onUpdate={handleUpdateGroup}
          onOpenAddUsers={handleOpenAddUsers}
          onRemoveUserFromGroup={handleRemoveUserFromGroup}
        />
      )}

      {/* Modals - shown conditionally based on state */}
      <CreateUserModal
        isOpen={showAddUserModal}
        allUsers={users}
        onClose={() => setShowAddUserModal(false)}
        onCreateUser={handleCreateUser}
      />

      <CreateGroupModal
        isOpen={showAddGroupModal}
        allGroups={groups}
        onClose={() => setShowAddGroupModal(false)}
        onCreateGroup={handleCreateGroup}
      />

      <AddUsersModal
        isOpen={showAddUsersModal}
        groupId={addUsersGroupId}
        allUsers={users}
        currentMembers={currentMembers}
        onClose={() => {
          setShowAddUsersModal(false);
          setAddUsersGroupId(null);
        }}
        onAddUsers={handleAddUsersToGroup}
      />

      <AssignGroupsModal
        isOpen={showAssignGroupsModal}
        userId={assignGroupsUserId}
        allGroups={groups}
        currentGroups={currentUserGroups}
        onClose={() => {
          setShowAssignGroupsModal(false);
          setAssignGroupsUserId(null);
        }}
        onAssignGroups={handleAssignGroupsToUser}
      />

      <DeleteConfirmationModal
        isOpen={showDeleteConfirmModal}
        type={deleteType}
        count={selectedIds.size}
        onConfirm={deleteType === 'users' ? confirmDeleteUsers : confirmDeleteGroups}
        onCancel={() => setShowDeleteConfirmModal(false)}
      />
    </div>
  );
}

export default App;
