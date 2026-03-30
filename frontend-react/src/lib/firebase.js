// Firebase has been removed. Replace with your chosen auth/database provider.
// This file exports stubs to prevent import errors during migration.

export const auth = {
  currentUser: null,
  onAuthStateChanged: (_callback) => () => {},
  signOut: async () => {},
};

export const db = null;

export const analytics = Promise.resolve(null);

export default null;
