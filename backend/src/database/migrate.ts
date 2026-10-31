import { env } from '../config/env.js';
import { Database } from './Database.js';

const applied = Database.open(env.databaseFile).migrate();
console.log(applied.length ? `Migrações aplicadas: ${applied.join(', ')}` : 'Banco já está atualizado.');
Database.close();
