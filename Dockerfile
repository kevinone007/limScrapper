# Establece la imagen base
FROM node:14

# Instala chromium y las dependencias necesarias
RUN apt-get update && apt-get install -y chromium-browser

# Configura el directorio de trabajo
WORKDIR /app

# Copia los archivos del proyecto
COPY package.json .
COPY package-lock.json .

# Instala las dependencias del proyecto
RUN npm install

# Copia el resto de los archivos del proyecto
COPY . .

# Expone el puerto que tu aplicación utiliza
EXPOSE 3000

# Comando para ejecutar tu aplicación
CMD ["npm", "start"]
