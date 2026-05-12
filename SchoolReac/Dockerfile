# Stage 1: Build the React application
FROM node:18-alpine AS build
WORKDIR /app
# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install
# Copy the rest of the application and build
COPY . .
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:alpine
# Copy the build output to Nginx's html folder (React default build output is usually /build or /dist)
COPY --from=build /app/build /usr/share/nginx/html

# Copy custom Nginx configuration to handle SPA routing and reverse proxy
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]