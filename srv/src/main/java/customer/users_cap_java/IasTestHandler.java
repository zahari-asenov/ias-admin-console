package customer.users_cap_java;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.Base64;
import java.util.List;

/**
 * Test handler to verify IAS service connection using simple HTTP request
 * This will run on application startup to test the connection
 */
@Component
public class IasTestHandler implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(IasTestHandler.class);

    @Value("https://a0adggohp.trial-accounts.ondemand.com/scim")
    private String iasUrl;

    @Value("f8d01d08-7847-4554-a995-2652d2e3581e")
    private String iasClientId;

    @Value("YjaC@:XbEw[TeX2:s?/I/3gQkp-6Nioiy")
    private String iasClientSecret;

    @Override
    public void run(String... args) {
        testIasConnection();
    }

    public void testIasConnection() {
        logger.info("Testing IAS service connection with simple HTTP request...");
        
        try {
            // Create RestTemplate and configure headers with basic auth
            RestTemplate restTemplate = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.setAccept(List.of(MediaType.parseMediaType("application/scim+json")));
            
            // Add basic authentication header
            String auth = iasClientId + ":" + iasClientSecret;
            String encodedAuth = Base64.getEncoder().encodeToString(auth.getBytes());
            headers.set("Authorization", "Basic " + encodedAuth);
            
            HttpEntity<String> entity = new HttpEntity<>(headers);

            // Make GET request to /Users endpoint
            String url = iasUrl + "/Users";
            logger.info("Making request to: {}", url);
            
            ResponseEntity<String> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                entity,
                String.class
            );

            // Parse JSON response
            ObjectMapper mapper = new ObjectMapper();
            JsonNode rootNode = mapper.readTree(response.getBody());
            
            logger.info("✅ IAS connection successful!");
            logger.info("Response status: {}", response.getStatusCode());
            
            // Extract users from Resources array
            JsonNode resources = rootNode.get("Resources");
            if (resources != null && resources.isArray()) {
                int userCount = resources.size();
                logger.info("Found {} user(s)", userCount);
                
                // Print first few users
                for (int i = 0; i < Math.min(userCount, 3); i++) {
                    JsonNode user = resources.get(i);
                    String userId = user.get("id").asText();
                    String email = "N/A";
                    if (user.has("emails") && user.get("emails").isArray() && user.get("emails").size() > 0) {
                        email = user.get("emails").get(0).get("value").asText();
                    }
                    String givenName = user.has("name") && user.get("name").has("givenName") 
                        ? user.get("name").get("givenName").asText() : "";
                    String familyName = user.has("name") && user.get("name").has("familyName") 
                        ? user.get("name").get("familyName").asText() : "";
                    
                    logger.info("User {}: ID={}, Email={}, Name={} {}", 
                        i + 1, userId, email, givenName, familyName);
                }
            } else {
                logger.warn("No Resources array found in response");
            }
            
        } catch (Exception e) {
            logger.error("❌ Failed to connect to IAS service: {}", e.getMessage(), e);
            e.printStackTrace();
        }
    }
}
