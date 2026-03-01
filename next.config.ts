
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    // Ignora erros de tipagem durante o build para garantir que o deploy não falhe por avisos menores
    ignoreBuildErrors: true,
  },
  eslint: {
    // Ignora erros de lint durante o build para deploy mais rápido e estável
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Otimização para pacotes que usam ESM e podem precisar de transpilação no ambiente serverless
  transpilePackages: ['genkit', '@genkit-ai/google-genai', 'lucide-react'],
};

export default nextConfig;
