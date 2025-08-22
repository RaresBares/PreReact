FROM nginx:stable-alpine

# Config kopieren
# Deine App-Dateien ins Webroot legen
COPY . /usr/share/nginx/html

EXPOSE 8102

CMD ["nginx", "-g", "daemon off;"]