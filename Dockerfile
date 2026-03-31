# syntax=docker/dockerfile:1.4

########## Base stage with common setup ##########
FROM node:20-alpine AS base

WORKDIR /app

# Install dependencies needed for some node packages
RUN apk add --no-cache libc6-compat

########## Dependencies stage ##########
FROM base AS deps

# Copy package files
COPY package.json package-lock.json ./

# Install ALL dependencies
RUN npm install --prefer-offline --no-audit --progress=false

########## Builder stage ##########
FROM base AS builder

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the Next.js application
RUN npm run build

########## Development stage ##########
FROM base AS development

COPY --from=deps /app/node_modules ./node_modules
COPY . .

EXPOSE 3000

# Running development server with hot-reload
CMD ["npm", "run", "dev"]

########## Production stage ##########
FROM base AS production

ENV NODE_ENV=production

# Only copy necessary files for runtime to keep it lightweight
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

CMD ["npm", "start"]

########## Default target ##########
FROM development
