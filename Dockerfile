FROM node:6.2.0
RUN apt-get update && apt-get upgrade -y

# Set environment variables
ENV appDir /app

# Set the work directory
RUN mkdir -p /app && mkdir -p /root/.ssh
WORKDIR ${appDir}

# Add our package.json and install *before* adding our app files
ADD package.json ./

RUN npm i --production

# Add app files
ADD . /app

#Expose the port
EXPOSE 3001

ENTRYPOINT npm run production
