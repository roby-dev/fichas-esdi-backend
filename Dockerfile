# syntax = docker/dockerfile:1

# Ajusta la versión de Node
ARG NODE_VERSION=20.18.0
FROM node:${NODE_VERSION}-slim AS base

LABEL fly_launch_runtime="NestJS"

# Directorio de trabajo
WORKDIR /app

# Setear entorno de producción
ENV NODE_ENV="production"

# Etapa de build
FROM base AS build

# Instalar dependencias necesarias para compilar módulos nativos
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential node-gyp pkg-config python-is-python3 && \
    rm -rf /var/lib/apt/lists/*

# Instalar pnpm
RUN npm install -g pnpm

# Copiar archivos de dependencias
COPY package.json pnpm-lock.yaml ./

# Instalar dependencias (incluyendo dev)
RUN pnpm install --frozen-lockfile

# Copiar el código fuente
COPY . .

# Compilar la aplicación
RUN pnpm build

# Etapa final
FROM base

# Instalar pnpm (si necesitas ejecutar scripts con él)
RUN npm install -g pnpm

# Copiar solo lo necesario del build
COPY --from=build /app /app

WORKDIR /app

# Exponer el puerto
EXPOSE 3000

# Comando por defecto
CMD ["pnpm", "start"]