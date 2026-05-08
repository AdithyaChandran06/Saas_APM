FROM node:20-alpine AS deps

WORKDIR /app
COPY package*.json ./
RUN npm install --no-audit --no-fund

FROM deps AS build

WORKDIR /app
COPY . .
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm install --no-audit --no-fund --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist
COPY --from=build /app/migrations ./migrations
COPY --from=build /app/drizzle.config.ts ./drizzle.config.ts

EXPOSE 5000
CMD ["node", "dist/index.cjs"]
