# Use Node.js 20 Alpine as base image
FROM node:20-alpine

# Prisma on Alpine needs OpenSSL
RUN apk add --no-cache openssl libc6-compat

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (skip postinstall: schema not present yet)
RUN npm install --ignore-scripts

# Copy application (includes prisma/schema.prisma)
COPY . .

# Generate Prisma client after schema is available
RUN npx prisma generate

# Expose the port the app runs on
EXPOSE 4000

# Apply pending migrations then start (do not rely on `npm start` / prestart — many hosts run `node` directly).
CMD ["sh", "-c", "npx prisma migrate deploy && exec node server.js"]
