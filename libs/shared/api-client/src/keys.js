export const userKeys = {
  all: ['users'],
  me: () => [...userKeys.all, 'me'],
  details: () => [...userKeys.all, 'detail'],
  detail: (/** @type {string} */ id) => [...userKeys.details(), id],
};
