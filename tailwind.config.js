/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html", // 扫描 HTML 文件以获取 Tailwind 类
    "./src/**/*.{js,ts,jsx,tsx}", // 扫描 src 目录下所有 JS/TS/JSX/TSX 文件
  ],
  theme: {
    extend: {}, // 在此扩展 Tailwind 的默认主题，例如添加自定义颜色、字体等
  },
  plugins: [], // 在此添加 Tailwind 插件
}
