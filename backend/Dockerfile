FROM node:20-alpine

WORKDIR /app

# Install essential libraries for Prisma and OpenSSL
RUN apk add --no-cache openssl libc6-compat

# Copy dependency specifications and Prisma schema
COPY package*.json ./
COPY prisma ./prisma/

# Install production dependencies
RUN npm install

# Generate Prisma client for Linux container
RUN npx prisma generate

# Copy application source code
COPY . .

# Cloud Run injects PORT (defaults to 8080)
ENV PORT=8080
EXPOSE 8080

CMD ["node", "index.js"]
