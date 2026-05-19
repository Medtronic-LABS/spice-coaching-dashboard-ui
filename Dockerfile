FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG VITE_API_BASE_URL=
ARG VITE_ADMIN_API_BASE_URL=http://localhost:8001
ARG VITE_USE_MOCK_API=true
ARG VITE_APP_ROLE=programManager

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_ADMIN_API_BASE_URL=$VITE_ADMIN_API_BASE_URL \
    VITE_USE_MOCK_API=$VITE_USE_MOCK_API \
    VITE_APP_ROLE=$VITE_APP_ROLE

RUN npm run build

FROM nginx:1.27-alpine AS runtime
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
