# Stage 1: Build the Vite app
FROM node:20-slim AS builder

# Set working directory
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./

# [CHANGED] Use 'npm install' instead of 'npm ci' to fix the lockfile mismatch
# Added --legacy-peer-deps to be safe against conflict errors
RUN npm install --legacy-peer-deps

# Copy the rest of the app
COPY . .

# Build the app (Using the memory limit for your Swap space)
RUN NODE_OPTIONS="--max-old-space-size=2048" npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build output to nginx html directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]