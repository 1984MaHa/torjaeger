FROM node:20-alpine
WORKDIR /srv
COPY server ./server
COPY app ./app
ENV PORT=8080 DATA_DIR=/data
EXPOSE 8080
CMD ["node", "server/server.js"]
