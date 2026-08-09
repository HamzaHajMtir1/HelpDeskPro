# syntax=docker/dockerfile:1
#
# HelpDeskPro — React (Vite) frontend
# Multi-stage: build the bundle with Node, serve it with Nginx.
# The Vite dev server is never used in this image.

# ---------------------------------------------------------------------------
# Stage 1 — build the production bundle
# ---------------------------------------------------------------------------
# vite@8 requires Node "^20.19.0 || >=22.12.0" (engines, package-lock.json).
FROM node:22-alpine AS build

WORKDIR /app

# Dependencies first: this layer is reused as long as the manifests are
# unchanged, so source edits do not re-install node_modules.
# `npm ci` installs strictly from package-lock.json (lockfileVersion 3).
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .

# package.json -> "build": "vite build"  ->  /app/dist
RUN npm run build

# ---------------------------------------------------------------------------
# Stage 2 — runtime: static files + Nginx only.
# No Node, no npm, no sources, no node_modules.
# ---------------------------------------------------------------------------
FROM nginx:1.29-alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

# Run as the unprivileged `nginx` user. Binding :80 as non-root works because
# Docker sets net.ipv4.ip_unprivileged_port_start=0 inside containers.
RUN chown -R nginx:nginx /usr/share/nginx/html /var/cache/nginx \
    && touch /var/run/nginx.pid \
    && chown nginx:nginx /var/run/nginx.pid

USER nginx

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -qO- http://127.0.0.1:80/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
