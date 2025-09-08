# --- Build Stage: compile React/TS ---
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

RUN chmod +x node_modules/.bin/vite && npm run build
RUN npm run build

# --- Runtime Stage: serve with Nginx ---
FROM nginx:alpine
WORKDIR /usr/share/nginx/html
RUN mkdir -p /usr/share/nginx/html/timemate
# Copy built assets (JS/CSS/etc.)
COPY --from=build /app/dist/ /usr/share/nginx/html/timemate/
# Copy HTML shell (index.html at repo root)
COPY --from=build /app/dist/index.html /usr/share/nginx/html/timemate/index.html

EXPOSE 8302
CMD ["nginx","-g","daemon off;"]
