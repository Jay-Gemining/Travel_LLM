import React, { useState } from 'react';
import HomePage from './components/HomePage';
import ResultsPage from './components/ResultsPage';
import LoadingSpinner from './components/LoadingSpinner';
// 假设 Tailwind CSS 已全局设置，例如在 index.css 或 main.css 中
// import './index.css'; // 或者你的 Tailwind CSS 主入口文件

function App() {
  const [isLoading, setIsLoading] = useState(false); // 是否正在加载
  const [error, setError] = useState(null);   // 存储错误信息 (字符串或 null)
  const [plan, setPlan] = useState(null);     // 将保存行程 JSON 数据

  const handleReset = () => {
    setPlan(null);
    setError(null);
    setIsLoading(false); // 确保加载状态也被重置
  };

  // 根据状态进行渲染的逻辑
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // 如果存在错误，则显著显示错误信息，并提供返回方式
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-red-50 p-4">
        <div className="bg-white p-8 rounded-lg shadow-xl text-center max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">发生错误</h2>
          <p className="text-gray-700 mb-6">{error}</p>
          <button
            onClick={handleReset}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-150"
          >
            返回首页重试
          </button>
        </div>
      </div>
    );
  }

  // 如果有行程计划数据，则显示结果页
  if (plan) {
    return <ResultsPage plan={plan} onReset={handleReset} />;
  }

  // 默认显示主页
  return (
    <HomePage
      setIsLoading={setIsLoading}
      setError={setError}
      setPlan={setPlan}
    />
  );
}

export default App;
