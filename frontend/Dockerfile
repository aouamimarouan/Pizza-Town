# ─── Frontend Dockerfile (Development) ──────────────────────────────────────
FROM node:22-alpine

WORKDIR /app

# Install dependencies first (layer-cached until package.json changes)
# --legacy-peer-deps is required because @tailwindcss/vite@4.x declares a peer
# of vite@^5||^6||^7, but this project uses vite@8 (not yet in its peer range).
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy the rest of the source code
COPY . .

# Expose Vite's default dev server port
EXPOSE 5173

# --host 0.0.0.0 is required so Vite listens on all interfaces inside Docker,
# allowing the port mapping in docker-compose to work correctly.
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
