/** @type {import('ts-jest').JestConfigWithTsJest} */
// eslint-disable-next-line no-undef
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/packages'],
  testMatch: ['**/*.spec.ts'],
  moduleNameMapper: {
    '^@peculiar/pdf-(.*)$': '<rootDir>/packages/$1/src'
  }
};