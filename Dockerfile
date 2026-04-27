# ----------------------------
# Build Stage
# ----------------------------
FROM node:22-slim AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build


# ----------------------------
# Production Stage
# ----------------------------
FROM node:22-slim

WORKDIR /app

# ⛔ DO NOT set NODE_ENV before npm ci
# ENV NODE_ENV=production   ❌ moved below

# Install ALL deps including devDependencies
COPY package.json package-lock.json ./
RUN npm ci --include=dev

# Now set production env
ENV NODE_ENV=production

# Copy compiled output
COPY --from=builder /app/dist ./dist

# Use non-root user
USER node

ENV PORT=3000
EXPOSE 3000

CMD ["node", "dist/main.js"]
