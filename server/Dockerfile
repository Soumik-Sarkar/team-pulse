FROM node:20-alpine
WORKDIR /app
COPY server/package*.json ./
RUN npm install --omit=dev
COPY server/src ./src
COPY docs/openapi.yaml /docs/openapi.yaml
EXPOSE 4000
CMD ["node", "src/index.js"]
