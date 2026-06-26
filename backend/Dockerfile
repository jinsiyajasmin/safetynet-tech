# AWS ECR Public Gallery mirror (avoids Docker Hub TLS timeouts on some networks).
# Bookworm slim (glibc) is more reliable for Prisma than Alpine (musl).
ARG NODE_IMAGE=public.ecr.aws/docker/library/node:20-bookworm-slim
FROM ${NODE_IMAGE}

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma

# Dummy URLs only for image build — real values come from compose/Coolify at runtime.
ENV DATABASE_URL="postgresql://build:build@127.0.0.1:5432/build"
ENV DIRECT_URL="postgresql://build:build@127.0.0.1:5432/build"

# Schema is present so postinstall can generate the Prisma client during install.
RUN npm ci --omit=dev

COPY . .

RUN npx prisma generate \
  && chmod +x docker-entrypoint.sh \
  && chmod +x docker-migrate.sh

EXPOSE 4000

ENTRYPOINT ["/app/docker-entrypoint.sh"]
