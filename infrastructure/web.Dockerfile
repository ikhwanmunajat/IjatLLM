FROM node:22-alpine AS build
WORKDIR /app
RUN apk add --no-cache bash coreutils
COPY package*.json ./
RUN npm ci
COPY . .
RUN mkdir -p .openai && \
    if [ ! -f .openai/hosting.json ]; then \
      printf '%s\n' '{"d1":"DB","project_id":"local-docker","r2":null}' > .openai/hosting.json; \
    fi
RUN npm run build

FROM node:22-alpine
WORKDIR /app
COPY --from=build /app ./
EXPOSE 3000
CMD ["npm", "run", "start"]
