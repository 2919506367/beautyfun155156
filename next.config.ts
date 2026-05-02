import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 允许手机/其他设备通过局域网 IP 访问 dev server。
  // 你的终端报错里写的是 192.168.31.100，所以这里先加这个。
  // 如果以后电脑局域网 IP 变了，把这里同步改成新的 IP。
  allowedDevOrigins: ["192.168.31.100"],
};

export default nextConfig;
