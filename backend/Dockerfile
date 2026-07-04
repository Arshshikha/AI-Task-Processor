# --- Stage 1: Build ---
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy code and build
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# --- Stage 2: Production Runner ---
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy built code from build stage
COPY --from=build /app/dist ./dist

# Run as non-root node user (pre-created in alpine image)
USER node

EXPOSE 5000

CMD ["node", "dist/index.js"]
