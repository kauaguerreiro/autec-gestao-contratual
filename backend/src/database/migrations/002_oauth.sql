-- Login com Google / Microsoft
ALTER TABLE users ADD COLUMN auth_provider TEXT NOT NULL DEFAULT 'password';
