# Stage 1: Build the Vite app
# FIX 1: Use Node 20 (Required by your app) and 'slim' (Smaller/Faster)
FROM node:20-slim AS builder

# Set working directory
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./

# FIX 2: Use 'npm ci' which is faster and cleaner for production builds than 'npm install'
RUN npm ci

# Copy the rest of the app
COPY . .

# FIX 3: Increase memory limit slightly (Assuming you added Swap)
# We rely on the Swap space created in the previous step to handle this.
RUN NODE_OPTIONS="--max-old-space-size=4096" npm run build

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