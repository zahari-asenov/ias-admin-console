namespace my.ias;

using { cuid, managed } from '@sap/cds/common';

type UserStatus : String(8) enum {
  Active;
  Inactive;
}

@assert.unique: { uniqueEmail: [ email ] }

entity Users : cuid, managed {
  // ID comes from cuid (UUID). Must not be changed (key).
  firstName   : String(100);                 // optional
  lastName    : String(100) not null;        // required
  @assert.unique  email       : String(255) not null;
  userType    : String(50)  not null;
  loginName   : String(255) not null;

  status      : UserStatus not null default 'Active';

  validFrom   : DateTime;                    // optional
  validTo     : DateTime;                    // optional
  company     : String(120);
  country     : String(2);                   // ISO-3166-1 alpha-2 recommended
  city        : String(120);

  // Navigation (computed via join entity)
  memberships : Composition of many GroupMembers
                  on memberships.user = $self;
}

@assert.unique: { uniqueGroupName: [ name ] }

entity Groups : cuid, managed {
  // ID comes from cuid (UUID). Must not be changed (key).
  @assert.unique  name        : String(255) not null;        // required and immutable by business rule
  displayName : String(255) not null;        // required and can be edited

  description : String(1000);

  members     : Composition of many GroupMembers
                  on members.group = $self;
}

entity GroupMembers : managed {
  key user  : Association to Users  not null;
  key group : Association to Groups not null;

  // Optional auditing info beyond managed
  // role : String(50);   // if you ever need membership roles
}
