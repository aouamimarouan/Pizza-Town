# ─── Backend Dockerfile (Development) ───────────────────────────────────────
FROM node:22-alpine

# Install openssl for Prisma
RUN apk add --no-cache openssl

WORKDIR /app

# Install dependencies first (layer-cached until package.json changes)
COPY package*.json ./
RUN npm ci

# Copy the rest of the source code
COPY . .

# Expose the Express port
EXPOSE 5000

# Startup script:
#   1. Generate Prisma client (always regenerate inside container)
#   2. Push schema to DB (creates/syncs tables — safe for dev)
#   3. Start the server
CMD ["sh", "-c", "npx prisma generate && npx prisma db push && npm start"]
