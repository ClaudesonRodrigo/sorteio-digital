module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src/__tests__'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  testRegex: '(/__tests__/.*|(\\.|/))(test|spec)\\.(ts|js)$',
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
};