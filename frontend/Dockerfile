# --- Stage 1: Build ---
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy configurations and assets
COPY tailwind.config.js ./
COPY postcss.config.js ./
COPY vite.config.ts ./
COPY tsconfig*.json ./
COPY index.html ./
COPY src ./src

# Set build argument for backend API URL, defaults to empty (relies on relative path or env variables in production)
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# --- Stage 2: Serve ---
# Using nginx unprivileged image to run as non-root on port 8080
FROM nginxinc/nginx-unprivileged:alpine

# Copy custom nginx configuration for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build files from previous stage
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
