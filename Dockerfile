FROM node:20-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@8 --activate

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml tsconfig.base.json ./
COPY packages/ packages/
COPY apps/ apps/

RUN pnpm install --frozen-lockfile
RUN pnpm run build:libs
RUN pnpm --filter employee-pwa build && \
    pnpm --filter manager-dashboard build && \
    pnpm --filter owner-dashboard build && \
    pnpm --filter landing-page build

FROM nginx:alpine
WORKDIR /usr/share/nginx/html

RUN rm -rf ./*

COPY --from=builder /app/apps/employee-pwa/dist /usr/share/nginx/html/employee
COPY --from=builder /app/apps/manager-dashboard/dist /usr/share/nginx/html/manager
COPY --from=builder /app/apps/owner-dashboard/dist /usr/share/nginx/html/owner
COPY --from=builder /app/apps/landing-page/dist /usr/share/nginx/html/landing

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
