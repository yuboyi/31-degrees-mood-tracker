/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // 已重置为更标准的 Tailwind 风格颜色，保留键名以避免现有类名失效。
      // 如需恢复项目专属色，请替换为原始 hex 值。
      colors: {
        mood: {
          excellent: '#10B981', // green-500
          good: '#06B6D4',      // teal-ish (保留原始)
          neutral: '#F59E0B',   // amber-500
          bad: '#F97316',       // orange-500
          terrible: '#EF4444',  // red-500
        },
        // 使用 Tailwind 常见语义色（参考 blue-600 / teal-500 / amber-500）
        primary: '#2563EB',   // blue-600 (更接近 Tailwind 默认蓝)
        secondary: '#14B8A6', // teal-500
        accent: '#F59E0B',    // amber-500
        dark: '#111827',      // gray-900
        light: '#F3F4F6',     // gray-100
        success: '#16A34A',   // green-600
        warning: '#F59E0B',   // amber-500
        danger: '#EF4444',    // red-500
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
