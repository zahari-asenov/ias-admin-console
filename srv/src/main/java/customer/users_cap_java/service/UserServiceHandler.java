package customer.users_cap_java.service;

import com.sap.cds.ql.Select;
import com.sap.cds.ql.Delete;
import com.sap.cds.ql.cqn.CqnSelect;
import com.sap.cds.services.persistence.PersistenceService;
import com.sap.cds.Result;
import com.sap.cds.Row;
import com.sap.cds.ql.cqn.CqnDelete;
import com.sap.cds.services.handler.EventHandler;
import com.sap.cds.services.handler.annotations.After;
import com.sap.cds.services.handler.annotations.Before;
import com.sap.cds.services.handler.annotations.ServiceName;
import com.sap.cds.services.cds.CqnService;
import com.sap.cds.services.cds.CdsDeleteEventContext;
import customer.users_cap_java.client.IasHttpClient;
import com.fasterxml.jackson.databind.ObjectMapper;
import cds.gen.iasreplicaservice.Users;
import cds.gen.iasreplicaservice.Users_;
import cds.gen.iasreplicaservice.Groups;
import cds.gen.iasreplicaservice.Groups_;
import cds.gen.iasreplicaservice.GroupMembers;
import cds.gen.iasreplicaservice.GroupMembers_;
import cds.gen.iasreplicaservice.IasReplicaService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
@ServiceName("IasReplicaService")
public class UserServiceHandler implements EventHandler {

    private final IasHttpClient iasClient;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final IasReplicaService iasReplicaService;
    private volatile boolean syncEnabled = true;
    

    @Autowired
    public UserServiceHandler(IasHttpClient iasClient, IasReplicaService iasReplicaService) {
        this.iasClient = iasClient;
        this.iasReplicaService = iasReplicaService;
    }

    @Autowired
    private PersistenceService persistenceService;

    public void setSyncEnabled(boolean enabled) {
        this.syncEnabled = enabled;
    }

    // ========== USER HANDLERS ==========
    
    @Before(event = CqnService.EVENT_CREATE, entity = Users_.CDS_NAME)
    public void onUserCreate(List<Users> users) throws Exception {
        for (Users user : users) {
            syncUserCreateBeforeSave(user);
        }
    }

    @Before(event = CqnService.EVENT_UPDATE, entity = Users_.CDS_NAME)
    public void onUserUpdate(List<Users> users) throws Exception {
        for (Users user : users) {
            syncUserUpdateBeforeSave(user);
        }
    }

    @Before(event = CqnService.EVENT_DELETE, entity = Users_.CDS_NAME)
    public void onUserDelete(CdsDeleteEventContext ctx) throws Exception {
        if (!syncEnabled) return; // Skip during scheduled sync
        
        CqnDelete delete = ctx.getCqn();
        
        // Convert DELETE to SELECT to read the entity first
        CqnSelect select = Select.from(delete.ref());
        Result result = persistenceService.run(select);
        
        if (result.first().isPresent()) {
            Row row = result.first().get();
            String userId = row.get("ID").toString();
            
            // Delete memberships first
            persistenceService.run(Delete.from(GroupMembers_.class).where(m -> m.user_ID().eq(userId)));
            
            System.out.println("Deleting user from IAS: " + userId);
            
            // Call IAS delete
            iasClient.deleteUser(userId);
            
            System.out.println("User deleted from IAS: " + userId);
        }
    }

    // ========== GROUP HANDLERS ==========
    
    @Before(event = CqnService.EVENT_CREATE, entity = Groups_.CDS_NAME)
    public void onGroupCreate(List<Groups> groups) throws Exception {
        for (Groups group : groups) {
            syncGroupCreateBeforeSave(group);
        }
    }

    @Before(event = CqnService.EVENT_UPDATE, entity = Groups_.CDS_NAME)
    public void onGroupUpdate(List<Groups> groups) throws Exception {
        for (Groups group : groups) {
            syncGroupUpdateBeforeSave(group);
        }
    }

    @Before(event = CqnService.EVENT_DELETE, entity = Groups_.CDS_NAME)
    public void onGroupDelete(CdsDeleteEventContext ctx) throws Exception {
        if (!syncEnabled) return; // Skip during scheduled sync
        
        CqnDelete delete = ctx.getCqn();
        
        // Convert DELETE to SELECT to read the entity first
        CqnSelect select = Select.from(delete.ref());
        Result result = persistenceService.run(select);
        
        if (result.first().isPresent()) {
            Row row = result.first().get();
            String groupId = row.get("ID").toString();
            
            // Delete memberships first
            persistenceService.run(Delete.from(GroupMembers_.class).where(m -> m.group_ID().eq(groupId)));
            
            System.out.println("Deleting group from IAS: " + groupId);
            
            // Call IAS delete
            iasClient.deleteGroup(groupId);
            
            System.out.println("Group deleted from IAS: " + groupId);
        }
    }

    // ========== MEMBERSHIP HANDLERS ==========
    
    @Before(event = CqnService.EVENT_CREATE, entity = GroupMembers_.CDS_NAME)
    public void populateMembershipIasIds(List<GroupMembers> memberships) {
        // No-op: IDs are already IAS IDs since Users and Groups use IAS IDs as primary keys
    }

    @After(event = CqnService.EVENT_CREATE, entity = GroupMembers_.CDS_NAME)
    public void onMembershipCreate(List<GroupMembers> memberships) throws Exception {
        for (GroupMembers membership : memberships) {
            syncMembershipAdd(membership);
        }
    }

    @Before(event = CqnService.EVENT_DELETE, entity = GroupMembers_.CDS_NAME)
    public void onMembershipDelete(CdsDeleteEventContext ctx) throws Exception {
        if (!syncEnabled) return; // Skip during scheduled sync
        
        CqnDelete delete = ctx.getCqn();
        
        // Convert DELETE to SELECT to read the entity first
        CqnSelect select = Select.from(delete.ref());
        Result result = persistenceService.run(select);
        
        for (Row row : result) {
            String groupId = row.get("group_ID") != null ? row.get("group_ID").toString() : null;
            String userId = row.get("user_ID") != null ? row.get("user_ID").toString() : null;
            
            if (groupId != null && userId != null) {
                System.out.println("Removing user " + userId + " from group " + groupId + " in IAS");
                
                // Call IAS to remove member from group
                syncMembershipRemove(groupId, userId);
                
                System.out.println("User " + userId + " removed from group " + groupId + " in IAS");
            }
        }
    }

    // ========== SYNC HELPERS ==========
    
    private void syncUserCreateBeforeSave(Users user) throws Exception {
        if (!syncEnabled) return; // Skip during scheduled sync
        
        String scimJson = userToScimJson(user);
        String response = iasClient.createUser(scimJson);
        
        // Parse response and set IAS ID as the entity's ID
        Map<String, Object> responseMap = objectMapper.readValue(response, Map.class);
        String iasUserId = responseMap.get("id") != null ? responseMap.get("id").toString() : null;
        
        if (iasUserId != null) {
            user.setId(iasUserId);  // Set IAS ID as the entity ID
            System.out.println("IAS User created with ID: " + iasUserId);
        }
    }

    private void syncUserUpdateBeforeSave(Users user) throws Exception {
        if (!syncEnabled) return; // Skip during scheduled sync
        
        String iasUserId = user.getId();  // ID is already the IAS ID
        if (iasUserId == null || iasUserId.isEmpty()) {
            // If no ID, treat as create
            syncUserCreateBeforeSave(user);
            return;
        }
        
        String scimJson = userToScimJson(user);
        String response = iasClient.updateUser(iasUserId, scimJson);
        
        // Parse response (IAS may return updated data)
        Map<String, Object> responseMap = objectMapper.readValue(response, Map.class);
        System.out.println("IAS User updated: " + iasUserId);
    }

    private void syncGroupCreateBeforeSave(Groups group) throws Exception {
        if (!syncEnabled) return; // Skip during scheduled sync
        
        String scimJson = groupToScimJson(group);
        String response = iasClient.createGroup(scimJson);
        
        // Parse response and set IAS ID as the entity's ID
        Map<String, Object> responseMap = objectMapper.readValue(response, Map.class);
        String iasGroupId = responseMap.get("id") != null ? responseMap.get("id").toString() : null;
        
        if (iasGroupId != null) {
            group.setId(iasGroupId);  // Set IAS ID as the entity ID
            System.out.println("IAS Group created with ID: " + iasGroupId);
        }
    }

    private void syncGroupUpdateBeforeSave(Groups group) throws Exception {
        if (!syncEnabled) return; // Skip during scheduled sync
        
        String iasGroupId = group.getId();  // ID is already the IAS ID
        if (iasGroupId == null || iasGroupId.isEmpty()) {
            // If no ID, treat as create
            syncGroupCreateBeforeSave(group);
            return;
        }
        
        String scimJson = groupToScimJson(group);
        String response = iasClient.updateGroup(iasGroupId, scimJson);
        
        // Parse response (IAS may return updated data)
        Map<String, Object> responseMap = objectMapper.readValue(response, Map.class);
        System.out.println("IAS Group updated: " + iasGroupId);
    }

    private void syncMembershipAdd(GroupMembers membership) throws Exception {
        if (!syncEnabled) return; // Skip during scheduled sync
        
        String iasGroupId = membership.getGroupId();  // Group ID is already IAS ID
        String iasUserId = membership.getUserId();    // User ID is already IAS ID
        
        if (iasGroupId == null || iasUserId == null) {
            return;
        }
        
        String patchJson = buildAddMemberPatch(iasUserId);
        iasClient.patchGroup(iasGroupId, patchJson);
    }

    private void syncMembershipRemove(String iasGroupId, String iasUserId) throws Exception {
        if (!syncEnabled) return; // Skip during scheduled sync
        
        if (iasGroupId == null || iasUserId == null) {
            return;
        }
        
        String patchJson = buildRemoveMemberPatch(iasUserId);
        iasClient.patchGroup(iasGroupId, patchJson);
    }

    // ========== SCIM MAPPERS ==========
    
    private String userToScimJson(Users user) throws Exception {
        Map<String, Object> scimUser = new HashMap<>();
        
        java.util.List<String> schemas = new java.util.ArrayList<>(java.util.Arrays.asList(
            "urn:ietf:params:scim:schemas:core:2.0:User",
            "urn:ietf:params:scim:schemas:extension:sap:2.0:User"
        ));
        if (user.getCompany() != null && !user.getCompany().isEmpty()) {
            schemas.add("urn:ietf:params:scim:schemas:extension:enterprise:2.0:User");
        }
        scimUser.put("schemas", schemas);
        
        scimUser.put("userName", user.getLoginName() != null ? user.getLoginName() : user.getEmail());
        
        Map<String, Object> name = new HashMap<>();
        name.put("givenName", user.getFirstName() != null ? user.getFirstName() : "");
        name.put("familyName", user.getLastName());
        scimUser.put("name", name);
        
        Map<String, Object> email = new HashMap<>();
        email.put("value", user.getEmail());
        email.put("primary", true);
        scimUser.put("emails", java.util.Arrays.asList(email));
        
        scimUser.put("active", "Active".equals(user.getStatus()));
        scimUser.put("userType", user.getUserType() != null ? user.getUserType() : "public");
        
        Map<String, Object> sapExtension = new HashMap<>();
        sapExtension.put("userId", user.getLoginName() != null ? user.getLoginName() : user.getEmail());
        if (user.getValidFrom() != null) {
            sapExtension.put("validFrom", user.getValidFrom().toString());
        }
        if (user.getValidTo() != null) {
            sapExtension.put("validTo", user.getValidTo().toString());
        }
        scimUser.put("urn:ietf:params:scim:schemas:extension:sap:2.0:User", sapExtension);
        
        if (user.getCompany() != null && !user.getCompany().isEmpty()) {
            Map<String, Object> entExtension = new HashMap<>();
            entExtension.put("organization", user.getCompany());
            scimUser.put("urn:ietf:params:scim:schemas:extension:enterprise:2.0:User", entExtension);
        }
        
        if ((user.getCountry() != null && !user.getCountry().isEmpty()) || (user.getCity() != null && !user.getCity().isEmpty())) {
            Map<String, Object> addr = new HashMap<>();
            addr.put("type", "home");
            addr.put("primary", false);
            if (user.getCountry() != null && !user.getCountry().isEmpty()) {
                addr.put("country", user.getCountry());
            }
            if (user.getCity() != null && !user.getCity().isEmpty()) {
                addr.put("locality", user.getCity());
            }
            scimUser.put("addresses", java.util.Arrays.asList(addr));
        }
        
        return objectMapper.writeValueAsString(scimUser);
    }

    private String groupToScimJson(Groups group) throws Exception {
        Map<String, Object> scimGroup = new HashMap<>();
        scimGroup.put("schemas", java.util.Arrays.asList(
            "urn:ietf:params:scim:schemas:core:2.0:Group",
            "urn:sap:cloud:scim:schemas:extension:custom:2.0:Group"
        ));
        scimGroup.put("displayName", group.getDisplayName());
        
        // Put description in the SAP custom extension namespace
        if (group.getDescription() != null) {
            Map<String, Object> customExtension = new HashMap<>();
            customExtension.put("description", group.getDescription());
            scimGroup.put("urn:sap:cloud:scim:schemas:extension:custom:2.0:Group", customExtension);
        }
        
        // For updates, include the ID if it exists
        if (group.getId() != null) {
            scimGroup.put("id", group.getId());
        }
        
        return objectMapper.writeValueAsString(scimGroup);
    }

    // ========== UTILITY METHODS ==========
    
    private String buildAddMemberPatch(String iasUserId) throws Exception {
        Map<String, Object> patchOp = new HashMap<>();
        patchOp.put("schemas", java.util.Arrays.asList("urn:ietf:params:scim:api:messages:2.0:PatchOp"));
        
        Map<String, Object> operation = new HashMap<>();
        operation.put("op", "add");
        operation.put("path", "members");
        
        Map<String, Object> memberValue = new HashMap<>();
        memberValue.put("value", iasUserId);
        operation.put("value", java.util.Arrays.asList(memberValue));
        
        patchOp.put("Operations", java.util.Arrays.asList(operation));
        return objectMapper.writeValueAsString(patchOp);
    }

    private String buildRemoveMemberPatch(String iasUserId) throws Exception {
        Map<String, Object> patchOp = new HashMap<>();
        patchOp.put("schemas", java.util.Arrays.asList("urn:ietf:params:scim:api:messages:2.0:PatchOp"));
        
        Map<String, Object> operation = new HashMap<>();
        operation.put("op", "remove");
        operation.put("path", "members[value eq \"" + iasUserId + "\"]");
        
        patchOp.put("Operations", java.util.Arrays.asList(operation));
        return objectMapper.writeValueAsString(patchOp);
    }
}
