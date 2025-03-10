# Token Flight UI

A modern web application for managing and visualizing token flights on the blockchain. Built with React, TypeScript, and Vite for optimal performance and developer experience.

## Technologies Used

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Docker
- Nginx (for production deployment)

## Prerequisites

- Node.js & npm - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- Docker (optional, for containerized deployment)

## Local Development

1. Clone the repository:
```sh
git clone <YOUR_GIT_URL>
cd token-flight-ui
```

2. Install dependencies:
```sh
npm install
```

3. Start the development server:
```sh
npm run dev
```

The application will be available at `http://localhost:5173`

## Docker Deployment

### Building the Docker Image

1. Build the image:
```sh
docker build -t token-flight-ui .
```

2. Run the container:
```sh
docker run -d -p 80:80 token-flight-ui
```

The application will be available at `http://localhost`

### Using Docker Compose (Recommended)

Create a `docker-compose.yml` file:

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "80:80"
    restart: unless-stopped
```

Then run:
```sh
docker-compose up -d
```

## Production Deployment

For production deployment with a custom domain:

1. Build the Docker image as shown above
2. Configure your DNS settings to point to your server
3. (Optional) Set up SSL/TLS certificates using Let's Encrypt
4. Deploy using Docker or your preferred container orchestration platform

## Development Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build locally

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
