# Stage 1: Build the Vite app
FROM node:18-bullseye AS builder

# Set working directory
WORKDIR /app

# Install dependencies (with workaround for optional deps)
COPY package.json package-lock.json ./
RUN npm install --legacy-peer-deps && npm rebuild

# Copy the rest of the app
COPY . .

# Build the app
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