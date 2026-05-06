FROM node:25-alpine AS base
WORKDIR /workspace
RUN corepack enable && corepack prepare pnpm@9.10.0 --activate

FROM base AS builder
COPY pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY packages/types ./packages/types
COPY packages/nest-common ./packages/nest-common
COPY services/auth-service ./services/auth-service
RUN pnpm install --frozen-lockfile=false
RUN pnpm --filter auth-service build

FROM base AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /workspace/packages /app/packages
COPY --from=builder /workspace/services/auth-service/dist /app/dist
COPY --from=builder /workspace/services/auth-service/package.json /app/package.json
COPY --from=builder /workspace/services/auth-service/node_modules /app/node_modules
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -qO- http://localhost:3001/auth/health || exit 1
CMD ["node", "dist/main.js"]
