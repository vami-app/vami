"use strict";

const IPublicationMemberRepository = require("./publication-members.repository.interface");
const PublicationMember = require("./publication-members.model");

const USER_FIELDS = "name username avatarUrl bio";

class MongoPublicationMemberRepository extends IPublicationMemberRepository {
  async create({ publication, user, role, invitedBy }) {
    const member = await PublicationMember.create({
      publication,
      user,
      role,
      invitedBy,
    });
    return PublicationMember.findById(member._id).populate("user", USER_FIELDS);
  }

  async findByPublicationAndUser({ publicationId, userId }) {
    if (!userId) return null;
    return PublicationMember.findOne({ publication: publicationId, user: userId });
  }

  async findRoleFor({ publicationId, userId }) {
    if (!userId) return null;
    const member = await PublicationMember.findOne({ publication: publicationId, user: userId }).select("role");
    return member ? member.role : null;
  }

  async listMembers(publicationId) {
    return PublicationMember.find({ publication: publicationId })
      .populate("user", USER_FIELDS)
      .sort({ joinedAt: 1 });
  }

  async countOwners(publicationId, excludingUserId = null) {
    const query = { publication: publicationId, role: "owner" };
    if (excludingUserId) {
      query.user = { $ne: excludingUserId };
    }
    return PublicationMember.countDocuments(query);
  }

  async updateRole({ publicationId, userId, role }) {
    const targetMember = await PublicationMember.findOne({
      publication: publicationId,
      user: userId,
    });
    if (!targetMember) return null;
    targetMember.role = role;
    await targetMember.save();
    return targetMember;
  }

  async remove({ publicationId, userId }) {
    const targetMember = await PublicationMember.findOne({
      publication: publicationId,
      user: userId,
    });
    if (!targetMember) return null;
    await targetMember.deleteOne();
    return true;
  }

  async findSeniorMember(publicationId, excludingUserId) {
    return PublicationMember.findOne({
      publication: publicationId,
      user: { $ne: excludingUserId },
    }).sort({ role: 1, joinedAt: 1 });
  }

  async findByUser(userId) {
    return PublicationMember.find({ user: userId })
      .populate("publication")
      .sort({ joinedAt: -1 });
  }

  async deleteManyByUser(userId) {
    return PublicationMember.deleteMany({ user: userId });
  }
}

module.exports = MongoPublicationMemberRepository;
