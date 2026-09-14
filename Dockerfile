FROM node:20-alpine AS builder

WORKDIR /app

# Use Tencent Cloud's npm mirror to keep builds reliable from mainland China.
ENV NPM_CONFIG_REGISTRY=https://mirrors.cloud.tencent.com/npm/

COPY package*.json ./
RUN npm ci

COPY . ./
RUN npm run build:cloudbase

# Next standalone output needs the public assets and generated static files copied
# beside server.js before it is moved into the small runtime image.
RUN cp -r public .next/standalone/public \
  && cp -r .next/static .next/standalone/.next/static

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=80
ENV HOSTNAME=0.0.0.0

COPY --from=builder /app/.next/standalone ./

EXPOSE 80

CMD ["node", "server.js"]
