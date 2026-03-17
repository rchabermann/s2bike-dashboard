/** @type {import('next').NextConfig} */
const nextConfig = {
  // Permite buscar dados do Google Sheets
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
