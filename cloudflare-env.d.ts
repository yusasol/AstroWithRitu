declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    ADMIN_USER_ID?: string;
    ADMIN_EMAIL?: string;
    CF_ACCESS_TEAM_DOMAIN?: string;
    CF_ACCESS_AUD?: string;
    INTAKE_ENCRYPTION_KEY?: string;
    PUBLIC_INTAKE_ENABLED?: string;
    LOCAL_DEV?: string;
    CONNECTORS?: import("./lib/connector-contract.mjs").ConnectorBinding;
  }
}
