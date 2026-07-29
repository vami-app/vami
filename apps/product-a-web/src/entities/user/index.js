// entities/user public API
// FSD rule: anything outside this directory must import from here, not from sub-paths
export { AuthProvider, useAuth } from './model/AuthContext';
export { useCurrentUser } from './model/useCurrentUser';
export { UserAvatar } from './ui/UserAvatar';
