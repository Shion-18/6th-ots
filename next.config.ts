import type { NextConfig } from "next";

// 親ディレクトリ（/Users/atasta）に無関係な package-lock.json があると、
// Next がそちらをワークスペースルートと誤推定して tailwindcss を解決できなくなる。
// 環境変数が無い場合もこのファイルの場所を root として固定する。
const projectRoot = process.env.TURBOPACK_ROOT ?? __dirname;

const nextConfig: NextConfig = {
  turbopack: { root: projectRoot },
  outputFileTracingRoot: projectRoot,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
        pathname: '/PokeAPI/sprites/master/sprites/pokemon/**',
      },
    ],
  },
};

export default nextConfig;
