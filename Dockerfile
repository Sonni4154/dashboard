# 1) build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* .npmrc* ./
RUN npm i --prefer-offline --no-audit --no-fund
COPY . .
RUN npm run build

# 2) runtime
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app ./
RUN npm i -g pm2
EXPOSE 3000
CMD ["pm2-runtime", "ecosystem.config.cjs"]

