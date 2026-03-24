# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency definitions
COPY package*.json ./

# Install dependencies (frozen/clean approach ensures accuracy)
RUN npm install

# Copy all source files
COPY . .

# Accept the API key as an injected build arg
ARG VITE_GEMINI_API_KEY
# Set it as an ENV so Vite's static build process bakes it securely into the dist/ output
ENV VITE_GEMINI_API_KEY=${VITE_GEMINI_API_KEY}

# Generate the static bundle
RUN npm run build

# Stage 2: Serve
FROM nginx:stable-alpine

# Copy the output from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Cloud Run defines the port dynamically via the $PORT environment variable.
# Nginx >= 1.19 automatically processes files in /etc/nginx/templates/ via envsubst.
# This template explicitly instructs Nginx to listen on $PORT and routes traffic to our single-page React app.
RUN mkdir -p /etc/nginx/templates && echo 'server { \
    listen ${PORT}; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/templates/default.conf.template

# Safe default if run locally outside Cloud Run
ENV PORT=8080
EXPOSE 8080

# The base Nginx image automatically handles executing the template substitution and running Nginx daemon off.
