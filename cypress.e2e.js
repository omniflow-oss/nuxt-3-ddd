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
    API_COMMON: process.env.API_COMMON,
    API_MOCK: process.env.API_MOCK,
    API_COMMON_MOCK: process.env.API_MOCK_COMMON,
    AUTH_BASE_URL: process.env.KEYCLOAK_BASE_URL,
    AUTH_REALM: process.env.REALMS,
    AUTH_CLIENT_ID: process.env.CLIENT_ID,
    AUTH_CLIENT_SECRET: process.env.CLIENT_SECRET_KEY,
  },
});
