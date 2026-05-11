# Stage 1: Build the Angular app
FROM node:18-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build --configuration=production

# Stage 2: Serve the app with NGINX
FROM nginx:alpine

# We copy the built angular app (Adjust "SchoolUI" if your angular.json outputs to a different folder name)
COPY --from=build /app/dist/SchoolUI/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]