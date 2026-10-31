# Imagem de produção do Autec (back-end servindo também o front-end)
FROM node:22-bookworm-slim AS build
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./
RUN npm run build && npm prune --omit=dev

FROM node:22-bookworm-slim
ENV NODE_ENV=production PORT=3000 FRONTEND_DIR=/app/frontend DATABASE_FILE=/data/autec.db STORAGE_DIR=/data/files
WORKDIR /app/backend
COPY --from=build /app/backend/node_modules ./node_modules
COPY --from=build /app/backend/dist ./dist
COPY --from=build /app/backend/package.json ./
COPY frontend/ /app/frontend/
VOLUME ["/data"]
EXPOSE 3000
CMD ["node", "dist/server.js"]
