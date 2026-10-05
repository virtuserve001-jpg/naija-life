FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force
COPY . .
ENV NODE_ENV=production PORT=8080 NAIJA_DATA_DIR=/app/data
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
