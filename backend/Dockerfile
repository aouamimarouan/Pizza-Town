# ─── Backend Dockerfile (Development) ───────────────────────────────────────
FROM node:22-alpine

# Install openssl for Prisma
RUN apk add --no-cache openssl

WORKDIR /app

# Install dependencies first (layer-cached until package.json changes)
COPY package*.json ./
RUN npm ci --loglevel notice

# Copy the rest of the source code
COPY . .

# Expose the Express port
EXPOSE 5000

# Start script
CMD ["sh", "-c", "npx prisma generate && npx prisma db push --accept-data-loss && npm start"]
