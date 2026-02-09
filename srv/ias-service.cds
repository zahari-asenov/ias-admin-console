// External service definition for SAP IAS SCIM API
service IasService @(protocol: 'rest') {
  // SCIM Users endpoint - only fields we need
  entity Users {
    key id : String;  // SCIM ID
    userName : String;  // For email matching
    name : {
      givenName : String;
      familyName : String;
    };
    emails : array of {
      value : String;
      primary : Boolean;
    };
    active : Boolean;
  }
  
  // SCIM Groups endpoint - only fields we need
  entity Groups {
    key id : String;  // SCIM ID
    displayName : String;
    members : array of {
      value : String;  // User SCIM ID
      display : String;
    };
  }
}
