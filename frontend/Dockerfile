# Stage 1: Build the React application
FROM node:20-alpine AS build

WORKDIR /app

# PaaS (Coolify) often passes --build-arg NODE_ENV=production. Vite must still be installed;
# it is listed in package.json "dependencies" so `npm ci` always installs it.
COPY package*.json ./
RUN npm ci || npm install

COPY . .

ARG VITE_BACKEND_URL
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL
ARG VITE_USE_RELATIVE_API
ENV VITE_USE_RELATIVE_API=$VITE_USE_RELATIVE_API
ARG VITE_BASE_PATH=/
ENV VITE_BASE_PATH=$VITE_BASE_PATH

# Call the binary directly (avoids npm script / npx / PATH edge cases → exit 127).
RUN node ./node_modules/vite/bin/vite.js build

# Stage 2: Serve the application using Nginx
FROM nginx:stable-alpine

COPY --from=build /app/dist /usr/share/nginx/html

RUN chmod -R a+rX /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
