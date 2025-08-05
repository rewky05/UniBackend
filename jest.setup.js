import '@testing-library/jest-dom';

// Mock Firebase
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(),
}));

jest.mock('firebase/database', () => ({
  getDatabase: jest.fn(),
  ref: jest.fn(),
  get: jest.fn(),
  set: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  onValue: jest.fn(),
  off: jest.fn(),
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn(),
}));

// Mock React Query
jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn(),
  useMutation: jest.fn(),
})); 