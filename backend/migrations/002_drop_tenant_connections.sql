-- Drop tenant_connections table: tenant DB connection now lives on users.database_url.
DROP TABLE IF EXISTS tenant_connections;
