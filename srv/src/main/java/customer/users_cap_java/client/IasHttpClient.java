package customer.users_cap_java.client;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class IasHttpClient {

    private final HttpClient client;
    private final String baseUrl;
    private final String authHeader;

    public IasHttpClient(
            @Value("https://a0adggohp.trial-accounts.ondemand.com/scim") String tenant,
            @Value("f8d01d08-7847-4554-a995-2652d2e3581e") String clientId,
            @Value("YjaC@:XbEw[TeX2:s?/I/3gQkp-6Nioiy") String clientSecret) {
        this.client = HttpClient.newHttpClient();
        this.baseUrl = tenant;

        String creds = clientId + ":" + clientSecret;
        String base64 = Base64.getEncoder()
                .encodeToString(creds.getBytes(StandardCharsets.UTF_8));

        this.authHeader = "Basic " + base64;
    }

    public String getUsers() throws Exception {
        return request("GET", "/Users", null);
    }

    public String getUser(String userId) throws Exception {
        return request("GET", "/Users/" + userId, null);
    }

    public String createUser(String userJson) throws Exception {
        return request("POST", "/Users", userJson);
    }

    public String updateUser(String userId, String userJson) throws Exception {
        return request("PUT", "/Users/" + userId, userJson);
    }

    public String deleteUser(String userId) throws Exception {
        System.out.println("[DEBUG] IasHttpClient.deleteUser - Called with userId: " + userId);
        System.out.println("[DEBUG] IasHttpClient.deleteUser - Making DELETE request to: /Users/" + userId);
        String result = request("DELETE", "/Users/" + userId, null);
        System.out.println("[DEBUG] IasHttpClient.deleteUser - Response: " + result);
        return result;
    }

    public String getGroups() throws Exception {
        return request("GET", "/Groups", null);
    }

    public String getGroup(String groupId) throws Exception {
        return request("GET", "/Groups/" + groupId, null);
    }

    public String createGroup(String groupJson) throws Exception {
        return request("POST", "/Groups", groupJson);
    }

    public String updateGroup(String groupId, String groupJson) throws Exception {
        return request("PUT", "/Groups/" + groupId, groupJson);
    }

    public String deleteGroup(String groupId) throws Exception {
        System.out.println("[DEBUG] IasHttpClient.deleteGroup - Called with groupId: " + groupId);
        System.out.println("[DEBUG] IasHttpClient.deleteGroup - Making DELETE request to: /Groups/" + groupId);
        String result = request("DELETE", "/Groups/" + groupId, null);
        System.out.println("[DEBUG] IasHttpClient.deleteGroup - Response: " + result);
        return result;
    }

    public String patchGroup(String groupId, String patchJson) throws Exception {
        return request("PATCH", "/Groups/" + groupId, patchJson);
    }

    private String request(String method, String path, String body) throws Exception {
        // Handle trailing slash in baseUrl
        String base = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
        String fullUrl = base + path;
        
        System.out.println("[DEBUG] IasHttpClient.request - Method: " + method + ", URL: " + fullUrl);
        
        HttpRequest.Builder requestBuilder = HttpRequest.newBuilder()
                .uri(URI.create(fullUrl))
                .header("Authorization", authHeader)
                .header("Accept", "application/scim+json")
                .header("Content-Type", "application/scim+json");

        if (body != null) {
            requestBuilder.method(method, HttpRequest.BodyPublishers.ofString(body));
            System.out.println("[DEBUG] IasHttpClient.request - Body: " + body);
        } else {
            requestBuilder.method(method, HttpRequest.BodyPublishers.noBody());
            System.out.println("[DEBUG] IasHttpClient.request - No body");
        }

        HttpRequest request = requestBuilder.build();

        System.out.println("[DEBUG] IasHttpClient.request - Sending request...");
        HttpResponse<String> response =
                client.send(request, HttpResponse.BodyHandlers.ofString());

        System.out.println("[DEBUG] IasHttpClient.request - Response status: " + response.statusCode());
        System.out.println("[DEBUG] IasHttpClient.request - Response body: " + response.body());

        if (response.statusCode() / 100 != 2) {
            System.err.println("[ERROR] IasHttpClient.request - Non-2xx status code: " + response.statusCode());
            throw new RuntimeException("HTTP " + response.statusCode() + ": " + response.body());
        }

        return response.body();
    }
}
