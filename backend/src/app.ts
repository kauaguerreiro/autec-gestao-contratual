import cors from 'cors';
import express from 'express';
import fs from 'node:fs';
import helmet from 'helmet';
import { env } from './config/env.js';
import type { Container } from './container.js';
import { errorHandler, notFound } from './middlewares/errorHandler.js';
import { buildRoutes } from './routes/index.js';

/** Cria a aplicação Express: API em /api e o front-end estático na raiz. */
export function createApp(container: Container) {
  const app = express();
  app.disable('x-powered-by');
  app.use(
    helmet({
      // o front-end usa scripts/estilos embutidos e carrega fontes e o pdf.js de CDNs
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdnjs.cloudflare.com'],
          scriptSrcAttr: ["'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
          imgSrc: ["'self'", 'data:', 'blob:'],
          frameSrc: ["'self'", 'blob:'],
          workerSrc: ["'self'", 'blob:', 'https://cdnjs.cloudflare.com'],
          connectSrc: ["'self'", 'https://cdnjs.cloudflare.com'],
          // em desenvolvimento (http://localhost) não força HTTPS
          upgradeInsecureRequests: env.isProd ? [] : null,
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );
  if (env.corsOrigins.length) app.use('/api', cors({ origin: env.corsOrigins }));

  app.use('/api', buildRoutes(container));
  app.use('/api', notFound);

  if (fs.existsSync(env.frontendDir)) {
    app.use(express.static(env.frontendDir, { extensions: ['html'] }));
  }
  app.use(errorHandler);
  return app;
}
