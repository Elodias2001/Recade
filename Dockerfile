# Site de documentation de Récade — statique, servi par nginx.
# Le CLI n'a pas de backend : il n'y a rien d'autre à faire tourner.

FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable

# Dépendances d'abord, pour que le cache tienne entre deux builds de contenu.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/cli/package.json apps/cli/package.json
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build:docs \
 && mkdir -p /out/docs \
 && cp -r site/. /out/ \
 && cp docs/*.html /out/docs/ \
 && cp -r docs/assets /out/docs/assets

FROM nginx:1.27-alpine AS runtime
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /out /usr/share/nginx/html
EXPOSE 8080
