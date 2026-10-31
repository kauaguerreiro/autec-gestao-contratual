// Copia os arquivos .sql de migração para a pasta de build (dist)
import { cpSync, mkdirSync } from 'node:fs';
mkdirSync('dist/database/migrations', { recursive: true });
cpSync('src/database/migrations', 'dist/database/migrations', { recursive: true });
console.log('Migrações copiadas para dist/');
