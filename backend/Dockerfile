FROM node:18-alpine

# Install pnpm
RUN corepack enable && corepack prepare pnpm@8.15.5 --activate

WORKDIR /app

COPY pnpm-lock.yaml package.json ./
RUN pnpm install

COPY . .

EXPOSE 5000

CMD ["pnpm", "start"]