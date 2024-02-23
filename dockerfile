# Establece la imagen base
FROM node:14

# Instala chromium y las dependencias necesarias
RUN apt-get update && apt-get install -y \
    chromium-browser \
    libx11-xcb1 libxcomposite1 libasound2 libatk1.0-0 libatk-bridge2.0-0 \
    libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 libgcc1 \
    libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 \
    libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 \
    libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 \
    libxtst6 && \
    rm -rf /var/lib/apt/lists/*

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
