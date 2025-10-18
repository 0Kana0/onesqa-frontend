# —— Stage 1: deps —— 
FROM node:22-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json ./
RUN npm ci --production=false

# —— Stage 2: build —— 
FROM node:22-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat
ENV NODE_OPTIONS="--max-old-space-size=4096"
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# ถ้าใช้ไฟล์ .env.production ต้องแน่ใจว่าไม่ถูก ignore
RUN npm run build

# —— Stage 3: runtime —— 
FROM node:22-alpine AS runner
WORKDIR /app
RUN apk add --no-cache libc6-compat
ENV NODE_ENV=production
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=deps /app/node_modules ./node_modules
# ลดขนาด
RUN npm prune --omit=dev
EXPOSE 3001
CMD ["npm","run","start","--","-p","3001","-H","0.0.0.0"]
