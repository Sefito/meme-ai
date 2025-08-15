FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy package files
COPY package*.json ./

# Install dependencies
RUN pnpm install
# Expose port
EXPOSE 5173

# Start the app
CMD ["pnpm", "run", "dev"]
