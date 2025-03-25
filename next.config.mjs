/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: process.env.NODE_ENV !== 'production',
  },
  // Asegurarnos que las imágenes pueden cargarse correctamente
  // desde la carpeta pública
  webpack(config) {
    return config;
  },
};

export default nextConfig;
