import session from "express-session";
import Keycloak from 'keycloak-connect'

var keycloakConfig = {
  resource: "nodejs-microservice",
  "bearer-only": true,
  "auth-server-url": process.env.KEYCLOAK_AUTH_URL,
  "ssl-required": "external",
  realm: "washroom",
  realmPublicKey: process.env.KEYCLOAK_PUBLIC_KEY,
};

export const memoryStore = new session.MemoryStore();
export const keycloak = new Keycloak(
  {
    secret: "some secret",
    resave: false,
    saveUninitialized: true,
    store: memoryStore,
  },
  keycloakConfig
);
