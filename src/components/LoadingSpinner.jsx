import React from 'react';

const LoadingSpinner = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="relative flex justify-center items-center">
        <div className="absolute animate-spin rounded-full h-24 w-24 border-t-4 border-b-4 border-blue-500"></div>
        <svg className="h-16 w-16 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      </div>
      <p className="text-xl text-gray-700 mt-6 font-semibold">正在为您生成专属行程...</p>
      <p className="text-md text-gray-500">AI管家正在思考，请稍候片刻。</p>
    </div>
  );
};

export default LoadingSpinner;