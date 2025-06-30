import React from 'react';

const LoadingSpinner = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      {/* 这是一个简单的 Tailwind CSS 动画加载指示器 */}
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mb-4"></div>
      <p className="text-lg text-gray-700">正在为您生成专属行程，请稍候...</p>
    </div>
  );
};

export default LoadingSpinner;
