FROM node:24.0.1-slim	

# Can add any container-level dependencies here - git, vim, curl
RUN mkdir -p /user/code/app/node_modules && chown -R node:node /user/code
WORKDIR /user/code
COPY package.json . 
# USER node
RUN npm install -g nodemon
RUN npm install
COPY . .
# COPY --chown=node:node . .

CMD ["npm", "run", "dev"]
# Entry point instruction that points to a script can be added here