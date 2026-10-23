FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci && npm install --ignore-scripts @rollup/rollup-linux-arm64-musl 2>/dev/null || npm ci
COPY . .

# Build-time variables for Vite. Only the four that CI passes as build args are
# set here; every other VITE_* value comes from the .env.production that CI
# writes from the target environment's variables (Dockerfile ENV would win over it).
ARG VITE_API_BASE_URL=https://spice-dev-backend.uhis.labsplatform.com/micro-coaching/medtronics-api
ARG VITE_ROUTE_PREFIX=/ai-coaching
ARG VITE_COACHING_SUITE_ACCESS=coaching
ARG VITE_DEV_AUTH_BYPASS=false

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_ROUTE_PREFIX=$VITE_ROUTE_PREFIX \
    VITE_COACHING_SUITE_ACCESS=$VITE_COACHING_SUITE_ACCESS \
    VITE_DEV_AUTH_BYPASS=$VITE_DEV_AUTH_BYPASS

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
