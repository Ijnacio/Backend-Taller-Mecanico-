# ETAPA 1: Construcción (BUILD)
# Usamos una imagen de Node ligera
FROM node:20-alpine AS builder

# Directorio de trabajo
WORKDIR /app

# Copiamos solo los archivos de dependencias primero (para aprovechar caché)
COPY package*.json ./

# Instalamos todas las dependencias (incluyendo devDependencies para compilar NestJS)
RUN npm ci

# Copiamos el resto del código fuente
COPY . .

# Compilamos el proyecto (genera la carpeta /dist)
RUN npm run build

# ETAPA 2: Producción (RUN)
FROM node:20-alpine

WORKDIR /app

# Copiamos solo los archivos necesarios desde la etapa anterior
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist

# Exponemos el puerto (NestJS suele usar 3000)
EXPOSE 3000

# Comando para iniciar en producción
CMD ["npm", "run", "start:prod"]