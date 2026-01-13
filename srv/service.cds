using { my.ias as db } from '../db/schema';

service IasReplicaService {
  entity Users  as projection on db.Users;
  entity Groups as projection on db.Groups;
  entity GroupMembers as projection on db.GroupMembers;
}

