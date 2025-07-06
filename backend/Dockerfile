FROM node:18-alpine

# Install openssl and other necessary packages
RUN apk add --no-cache openssl

# Install pnpm
RUN corepack enable && corepack prepare pnpm@8.15.5 --activate

WORKDIR /app

COPY pnpm-lock.yaml package.json ./
RUN pnpm install

COPY prisma ./prisma
RUN npx prisma generate

COPY . .

EXPOSE 5000

CMD ["pnpm", "start"]