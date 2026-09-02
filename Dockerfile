FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time environment variables for Vite
ARG VITE_API_BASE_URL=https://agent-qa.beehyv.com/medtronics-api
ARG VITE_ROUTE_PREFIX=/medtronics-ui
ARG VITE_DEPLOYMENT_PRIMARY_LOCALE=bn
ARG VITE_SPICE_API_BASE_URL=https://spice-dev-backend.uhis.labsplatform.com
ARG VITE_SPICE_WEB_LOGIN_URL=https://spice-dev.uhis.labsplatform.com/
ARG VITE_COACHING_SUITE_ACCESS=coaching
ARG VITE_SPICE_ADMIN_API_URL=/admin-service
ARG VITE_SPICE_USER_API_URL=/user-service
ARG VITE_ERROR_REPORTING_URL=

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_ROUTE_PREFIX=$VITE_ROUTE_PREFIX \
    VITE_DEPLOYMENT_PRIMARY_LOCALE=$VITE_DEPLOYMENT_PRIMARY_LOCALE \
    VITE_SPICE_API_BASE_URL=$VITE_SPICE_API_BASE_URL \
    VITE_SPICE_WEB_LOGIN_URL=$VITE_SPICE_WEB_LOGIN_URL \
    VITE_COACHING_SUITE_ACCESS=$VITE_COACHING_SUITE_ACCESS \
    VITE_SPICE_ADMIN_API_URL=$VITE_SPICE_ADMIN_API_URL \
    VITE_SPICE_USER_API_URL=$VITE_SPICE_USER_API_URL \
    VITE_ERROR_REPORTING_URL=$VITE_ERROR_REPORTING_URL

RUN npm run build

# Normalize prefix (leading slash, no trailing slash) and render nginx config.
RUN PREFIX="$(printf '%s' "$VITE_ROUTE_PREFIX" | sed 's|^/*|/|; s|/*$||')" \
    && test -n "$PREFIX" \
    && sed "s|__ROUTE_PREFIX__|${PREFIX}|g" nginx/default.conf.template > /tmp/default.conf \
    && printf '%s' "$PREFIX" > /tmp/route-prefix

FROM nginx:1.27-alpine AS runtime
COPY --from=builder /tmp/default.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /tmp/route-prefix /tmp/route-prefix
COPY --from=builder /app/dist /tmp/app-dist
# Place assets under the same path prefix Vite baked into the build.
RUN PREFIX="$(cat /tmp/route-prefix)" \
    && mkdir -p "/usr/share/nginx/html${PREFIX}" \
    && cp -a /tmp/app-dist/. "/usr/share/nginx/html${PREFIX}/" \
    && rm -rf /tmp/app-dist /tmp/route-prefix
EXPOSE 80
