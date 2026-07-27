"use strict";

class IPublicationMemberRepository {
  async create(data) { throw new Error("not implemented"); }
  async findByPublicationAndUser({ publicationId, userId }) { throw new Error("not implemented"); }
  async findRoleFor({ publicationId, userId }) { throw new Error("not implemented"); }
  async listMembers(publicationId) { throw new Error("not implemented"); }
  async countOwners(publicationId, excludingUserId) { throw new Error("not implemented"); }
  async updateRole({ publicationId, userId, role }) { throw new Error("not implemented"); }
  async remove({ publicationId, userId }) { throw new Error("not implemented"); }
  async findSeniorMember(publicationId, excludingUserId) { throw new Error("not implemented"); }
  async findByUser(userId) { throw new Error("not implemented"); }
  async deleteManyByUser(userId) { throw new Error("not implemented"); }
}

module.exports = IPublicationMemberRepository;
