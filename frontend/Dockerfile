FROM node:20-alpine AS builder

# Accept build arguments for Vite environment variables
ARG VITE_DEBUG_MODE=false
ARG VITE_TELEGRAM_BOT_USERNAME=sha_nails_test
ARG VITE_API_URL=/api/v1

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Set environment variables for the build
ENV VITE_DEBUG_MODE=$VITE_DEBUG_MODE
ENV VITE_TELEGRAM_BOT_USERNAME=$VITE_TELEGRAM_BOT_USERNAME
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build
RUN npm prune --production

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/build build/
COPY --from=builder /app/node_modules node_modules/
COPY package.json .

ENV NODE_ENV=production
ENV PORT=5173
ENV HOST=0.0.0.0

EXPOSE 5173
CMD [ "node", "build" ]