FROM node:20-bookworm AS builder

# Truyền URL API từ docker-compose vào lúc build để Next.js build-in
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Build dự án Next.js
RUN npm run build

# Stage 2: Chỉ mang theo các files chạy cần thiết để giảm footprint
FROM node:20-bookworm-slim AS runner

WORKDIR /app

# Copy các dependencies và thư mục đã build
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/next.config.* ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000
ENV PORT=3000

CMD ["npm", "start"]
