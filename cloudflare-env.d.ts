declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    ADMIN_USER_ID?: string;
    INTAKE_ENCRYPTION_KEY?: string;
    PUBLIC_INTAKE_ENABLED?: string;
    LOCAL_DEV?: string;
    CONNECTORS?: import("./lib/connector-contract.mjs").ConnectorBinding;
  }
}
