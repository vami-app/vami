import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/db';
import Admin from '@/models/Admin';
import { signToken } from '@/lib/auth';
import { ROLE_PERMISSIONS, ROLES } from '@/lib/permissions';

export const authenticateAdmin = async (email, password) => {
  await dbConnect();
  
  const admin = await Admin.findOne({ email: email.toLowerCase() });
  if (!admin) {
    return { error: 'Invalid credentials', status: 401 };
  }

  const isValid = await bcrypt.compare(password, admin.passwordHash);
  if (!isValid) {
    return { error: 'Invalid credentials', status: 401 };
  }

  const role = admin.role || ROLES.SUPER_ADMIN;
  const permissions = ROLE_PERMISSIONS[role];
  const token = await signToken({ adminId: admin._id, role, permissions });

  return { token };
};

export const updateAdminPassword = async (email, currentPassword, newPassword) => {
  await dbConnect();
  
  const admin = await Admin.findOne({ email });
  if (!admin) {
    return { error: 'Admin not found', status: 404 };
  }

  const valid = await bcrypt.compare(currentPassword, admin.passwordHash);
  if (!valid) {
    return { error: 'Current password is incorrect', status: 400 };
  }

  admin.passwordHash = await bcrypt.hash(newPassword, 12);
  await admin.save();

  return { success: true };
};
