# sudo docker build . -t pb/node-web-app
# sudo docker run -p 8080:5000 -d pb/node-web-app

FROM node:18

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)

COPY package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
COPY . .

# Makes sure port 5000 is being broadcast to the world
EXPOSE 5000

RUN npm run build

CMD [ "node", "dist/index.js" ]