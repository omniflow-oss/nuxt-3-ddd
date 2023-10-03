import { defineConfig } from 'cypress';
require('dotenv').config();
export default defineConfig({
  $schema: 'https://raw.githubusercontent.com/cypress-io/cypress/develop/cli/schema/cypress.schema.json',
  chromeWebSecurity: false,
  e2e: {
    specPattern: '.',
    baseUrl: 'http://localhost:3000',
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
  env: {
    API: process.env.API,
    API_MOCK: process.env.API_MOCK
  },
});
