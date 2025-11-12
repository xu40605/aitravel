FROM node:20-alpine AS front-builder
WORKDIR /app/front
COPY front/package*.json ./
RUN npm ci
COPY front/ .
RUN npm run build

FROM node:20-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install
COPY backend/ .
RUN npm run build

# 将前端构建产物复制到后端的静态目录
RUN mkdir -p /app/backend/dist/public
COPY --from=front-builder /app/front/dist /app/backend/dist/public

FROM node:20-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app/backend
RUN apk add --no-cache ffmpeg
COPY backend/package*.json ./
RUN npm install --omit=dev
COPY --from=backend-builder /app/backend/dist ./dist
COPY --from=front-builder /app/front/dist ./dist/public
EXPOSE 3000
CMD ["node", "dist/index.js"]