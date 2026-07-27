"use strict";

const MongoMembershipRepository = require("./membership.repository.mongo");
const MembershipService = require("./membership.service");

const membershipRepository = new MongoMembershipRepository();
const membershipService = new MembershipService(membershipRepository);

module.exports = {
  membershipRepository,
  membershipService,
};
