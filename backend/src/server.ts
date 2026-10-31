import { env } from './config/env.js';
import { buildContainer } from './container.js';
import { createApp } from './app.js';

const container = buildContainer();
const app = createApp(container);

app.listen(env.port, () => {
  console.log(`\n  Autec rodando em http://localhost:${env.port}`);
  console.log(`  API:            http://localhost:${env.port}/api/health`);
  console.log(`  Banco de dados: ${env.databaseFile}`);
  console.log(`  IA:             ${container.services.ai.configured ? 'configurada' : 'NÃO configurada (defina ANTHROPIC_API_KEY no .env)'}\n`);
});
