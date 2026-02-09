package customer.users_cap_java.service;

import com.sap.cds.ql.Select;
import com.sap.cds.ql.Insert;
import com.sap.cds.ql.Update;
import com.sap.cds.ql.Delete;
import com.sap.cds.services.persistence.PersistenceService;
import com.sap.cds.Result;
import customer.users_cap_java.client.IasHttpClient;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;
import cds.gen.iasreplicaservice.Users;
import cds.gen.iasreplicaservice.Users_;
import cds.gen.iasreplicaservice.Groups;
import cds.gen.iasreplicaservice.Groups_;
import cds.gen.iasreplicaservice.GroupMembers;
import cds.gen.iasreplicaservice.GroupMembers_;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.*;

@Component
public class IasSyncScheduler {

    private final IasHttpClient iasClient;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private volatile boolean syncing = false;
    
    @Autowired
    private PersistenceService db;
    
    @Autowired
    private UserServiceHandler userServiceHandler;

    @Autowired
    public IasSyncScheduler(IasHttpClient iasClient) {
        this.iasClient = iasClient;
    }

    @Scheduled(fixedRate = 60000) // Every 60 seconds
    public void syncFromIas() {
        if (syncing) {
            System.out.println("[SYNC] Already syncing, skipping...");
            return;
        }
        
        syncing = true;
        System.out.println("[SYNC] Starting sync...");
        
        try {
            userServiceHandler.setSyncEnabled(false); // Prevent DB->IAS sync during this
            
            syncUsers();
            syncGroups();
            syncMemberships();
            
            System.out.println("[SYNC] Completed");
        } catch (Exception e) {
            System.err.println("[SYNC] Error: " + e.getMessage());
            e.printStackTrace();
        } finally {
            userServiceHandler.setSyncEnabled(true);
            syncing = false;
        }
    }

    // ========== SYNC USERS ==========
    
    private void syncUsers() throws Exception {
        // Get users from IAS
        String json = iasClient.getUsers();
        JsonNode resources = objectMapper.readTree(json).get("Resources");
        
        if (resources == null) return;

        // Get users from DB
        var dbResult = db.run(Select.from(Users_.class));
        Map<String, Users> dbUsers = new HashMap<>();
        for (Users u : dbResult) {
            dbUsers.put(u.getId(), u);
        }

        Set<String> iasUserIds = new HashSet<>();
        
        // Process each IAS user
        for (JsonNode node : resources) {
            String id = node.get("id").asText();
            iasUserIds.add(id);
            
            Users user = mapUser(node);
            
            if (dbUsers.containsKey(id)) {
                // Update
                db.run(Update.entity(Users_.class).data(user).where(u -> u.ID().eq(id)));
            } else {
                // Create
                db.run(Insert.into(Users_.class).entry(user));
            }
        }
        
        // Delete users not in IAS
        for (String dbId : dbUsers.keySet()) {
            if (!iasUserIds.contains(dbId)) {
                db.run(Delete.from(Users_.class).where(u -> u.ID().eq(dbId)));
            }
        }
    }

    // ========== SYNC GROUPS ==========
    
    private void syncGroups() throws Exception {
        // Get groups from IAS
        String json = iasClient.getGroups();
        System.out.println("[DEBUG] IasSyncScheduler.syncGroups - JSON: " + json);
        JsonNode resources = objectMapper.readTree(json).get("Resources");
        
        if (resources == null) return;

        // Get groups from DB
        var dbResult = db.run(Select.from(Groups_.class));
        Map<String, Groups> dbGroups = new HashMap<>();
        for (Groups g : dbResult) {
            dbGroups.put(g.getId(), g);
            System.out.println("[DEBUG] IasSyncScheduler.syncGroups - DB Group: " + g.getId());
        }

        Set<String> iasGroupIds = new HashSet<>();
        
        // Process each IAS group
        for (JsonNode node : resources) {
            String id = node.get("id").asText();
            iasGroupIds.add(id);
            
            Groups group = mapGroup(node);
            
            if (dbGroups.containsKey(id)) {
                // Update
                db.run(Update.entity(Groups_.class).data(group).where(g -> g.ID().eq(id)));
            } else {
                // Create
                db.run(Insert.into(Groups_.class).entry(group));
            }
        }
        
        // Delete groups not in IAS
        for (String dbId : dbGroups.keySet()) {
            if (!iasGroupIds.contains(dbId)) {
                db.run(Delete.from(Groups_.class).where(g -> g.ID().eq(dbId)));
            }
        }
    }

    // ========== SYNC MEMBERSHIPS ==========
    
    private void syncMemberships() throws Exception {
        // Get groups (with members) from IAS
        String json = iasClient.getGroups();
        JsonNode resources = objectMapper.readTree(json).get("Resources");
        
        if (resources == null) return;

        // Get memberships from DB
        var dbResult = db.run(Select.from(GroupMembers_.class));
        Set<String> dbKeys = new HashSet<>();
        for (GroupMembers m : dbResult) {
            if (m.getGroupId() != null && m.getUserId() != null) {
                dbKeys.add(m.getGroupId() + ":" + m.getUserId());
            }
        }

        Set<String> iasKeys = new HashSet<>();
        
        // Process memberships from IAS
        for (JsonNode groupNode : resources) {
            String groupId = groupNode.get("id").asText();
            JsonNode members = groupNode.get("members");
            
            if (members != null && members.isArray()) {
                for (JsonNode member : members) {
                    String userId = member.get("value").asText();
                    String key = groupId + ":" + userId;
                    iasKeys.add(key);
                    
                    if (!dbKeys.contains(key)) {
                        // Create membership
                        GroupMembers m = GroupMembers.create();
                        m.setGroupId(groupId);
                        m.setUserId(userId);
                        db.run(Insert.into(GroupMembers_.class).entry(m));
                    }
                }
            }
        }
        
        // Delete memberships not in IAS
        for (String key : dbKeys) {
            if (!iasKeys.contains(key)) {
                String[] parts = key.split(":");
                db.run(Delete.from(GroupMembers_.class)
                    .where(m -> m.group_ID().eq(parts[0]).and(m.user_ID().eq(parts[1]))));
            }
        }
    }

    // ========== MAPPERS ==========
    
    private Users mapUser(JsonNode node) {
        Users user = Users.create();
        user.setId(node.get("id").asText());
        
        if (node.has("userName")) {
            user.setLoginName(node.get("userName").asText());
        }
        
        if (node.has("name")) {
            JsonNode name = node.get("name");
            if (name.has("givenName")) user.setFirstName(name.get("givenName").asText());
            if (name.has("familyName")) user.setLastName(name.get("familyName").asText());
        }
        
        if (node.has("emails") && node.get("emails").isArray() && node.get("emails").size() > 0) {
            user.setEmail(node.get("emails").get(0).get("value").asText());
        }
        
        user.setStatus(node.has("active") && node.get("active").asBoolean() ? "Active" : "Inactive");
        user.setUserType(node.has("userType") ? node.get("userType").asText() : "public");
        
        // SAP extension: validFrom, validTo
        if (node.has("urn:ietf:params:scim:schemas:extension:sap:2.0:User")) {
            JsonNode sapExt = node.get("urn:ietf:params:scim:schemas:extension:sap:2.0:User");
            if (sapExt.has("validFrom") && !sapExt.get("validFrom").isNull()) {
                try {
                    user.setValidFrom(Instant.parse(sapExt.get("validFrom").asText()));
                } catch (Exception ignored) {}
            }
            if (sapExt.has("validTo") && !sapExt.get("validTo").isNull()) {
                try {
                    user.setValidTo(Instant.parse(sapExt.get("validTo").asText()));
                } catch (Exception ignored) {}
            }
        }
        
        // Enterprise extension: organization -> company
        if (node.has("urn:ietf:params:scim:schemas:extension:enterprise:2.0:User")) {
            JsonNode entExt = node.get("urn:ietf:params:scim:schemas:extension:enterprise:2.0:User");
            if (entExt.has("organization") && !entExt.get("organization").isNull()) {
                user.setCompany(entExt.get("organization").asText());
            }
        }
        
        // Addresses: country, locality -> city (from first address)
        if (node.has("addresses") && node.get("addresses").isArray() && node.get("addresses").size() > 0) {
            JsonNode addr = node.get("addresses").get(0);
            if (addr.has("country") && !addr.get("country").isNull()) {
                user.setCountry(addr.get("country").asText());
            }
            if (addr.has("locality") && !addr.get("locality").isNull()) {
                user.setCity(addr.get("locality").asText());
            }
        }
        
        return user;
    }

    private Groups mapGroup(JsonNode node) {
        Groups group = Groups.create();
        group.setId(node.get("id").asText());
        
        // Read displayName from root level
        if (node.has("displayName")) {
            group.setDisplayName(node.get("displayName").asText());
        }
        
        // Read name and description from the extension
        String extensionKey = "urn:sap:cloud:scim:schemas:extension:custom:2.0:Group";
        if (node.has(extensionKey)) {
            JsonNode extension = node.get(extensionKey);
            
            // Read name from extension
            if (extension.has("name")) {
                group.setName(extension.get("name").asText());
            }
            
            // Read description from extension
            if (extension.has("description")) {
                group.setDescription(extension.get("description").asText());
            }
        }
        
        return group;
    }
}
