// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })

import utils_1 from './utils';

Cypress.Commands.add('keycloakLogin', function (user) {
  Cypress.log({ name: 'Login' });
  cy.fixture('users/' + user).then(function (userData) {
    const authBaseUrl = Cypress.env('AUTH_BASE_URL');
    const realm = Cypress.env('AUTH_REALM');
    const client_id = Cypress.env('AUTH_CLIENT_ID');
    const client_secret = Cypress.env('AUTH_CLIENT_SECRET');
    cy.request({
      url: authBaseUrl + '/realms/' + realm + '/protocol/openid-connect/auth',
      followRedirect: false,
      qs: {
        scope: 'openid',
        response_type: 'code',
        approval_prompt: 'auto',
        redirect_uri: Cypress.config('baseUrl'),
        client_id: client_id,
      },
    })
      .then(function (response) {
        // Convert the HTML string into a document object
        const parser = new DOMParser();
        const doc = parser.parseFromString(response.body, 'text/html');
        const url = doc.querySelector('form').action;
        return cy.request({
          method: 'POST',
          url: url,
          followRedirect: false,
          form: true,
          body: {
            username: userData.username,
            password: userData.password,
          },
        });
      })
      .then(function (response) {
        const code = utils_1.getParameterByName('code', response.headers['location']);
        cy.request({
          method: 'post',
          url: authBaseUrl + '/realms/' + realm + '/protocol/openid-connect/token',
          body: {
            client_id: client_id,
            redirect_uri: Cypress.config('baseUrl'),
            code: code,
            grant_type: 'authorization_code',
            client_secret: client_secret,
          },
          form: true,
          followRedirect: false,
        }).its('body');
      });
  });
});

Cypress.Commands.add('keycloakLogout', function () {
  Cypress.log({ name: 'Logout' });
  const authBaseUrl = Cypress.env('AUTH_BASE_URL');
  const realm = Cypress.env('AUTH_REALM');
  return cy.request({
    url: authBaseUrl + '/realms/' + realm + '/protocol/openid-connect/logout',
  });
});
