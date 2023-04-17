FROM node:16-alpine
WORKDIR /app
COPY package.json package-lock.json /app/
RUN npm install
RUN npm install -g nodemon
CMD ["nodemon","index"]