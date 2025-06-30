import React, { useState } from 'react';
import axios from 'axios';

const ALL_INTERESTS = [
  '美食探索', '历史古迹', '自然风光', '购物血拼',
  '艺术文化', '休闲放松', '户外运动', '夜生活', '亲子时光'
];

const HomePage = ({ setIsLoading, setError, setPlan }) => {
  const [city, setCity] = useState('');
  const [days, setDays] = useState(3);
  const [interests, setInterests] = useState([]);

  const handleInterestToggle = (interest) => {
    setInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!city.trim()) {
      setError("请输入目的地城市。");
      return;
    }
    if (interests.length === 0) {
      setError("请至少选择一个旅行兴趣。");
      return;
    }

    setIsLoading(true);
    setError(null);
    setPlan(null);

    try {
      // In a Vite project, /api/plan will be proxied to the backend.
      // For local dev, ensure backend is running on a port like 8000
      // and vite.config.js has proxy settings.
      // Example: http://localhost:8000/api/plan if backend is on 8000.
      const response = await axios.post('/api/plan', { city, days, interests });
      setPlan(response.data);
    } catch (err) {
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else if (err.request) {
        setError('无法连接到服务器，请检查网络或后端服务是否运行。');
      } else {
        setError('发生未知错误，请稍后再试。');
      }
      console.error("API Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600 flex flex-col justify-center items-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-lg">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-2">
          你的专属AI旅行规划师
        </h1>
        <p className="text-center text-gray-600 mb-8">
          输入目的地、天数和兴趣，即刻生成个性化行程！
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
              目的地城市
            </label>
            <input
              type="text"
              id="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="例如：成都、巴黎"
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              required
            />
          </div>

          <div>
            <label htmlFor="days" className="block text-sm font-medium text-gray-700 mb-1">
              旅行天数
            </label>
            <select
              id="days"
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value))}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              {[...Array(7).keys()].map(i => (
                <option key={i + 1} value={i + 1}>{i + 1} 天</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              旅行兴趣 (可选多个)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {ALL_INTERESTS.map(interest => (
                <button
                  type="button"
                  key={interest}
                  onClick={() => handleInterestToggle(interest)}
                  className={`px-3 py-2 text-sm rounded-lg border-2 transition-all duration-150
                    ${interests.includes(interest)
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-indigo-50 hover:border-indigo-400'
                    }`}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg transition duration-150 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            立即生成行程 &rarr;
          </button>
        </form>
      </div>
       <footer className="mt-8 text-center">
        <p className="text-sm text-indigo-100">
          行程AIGC v1.0 - Code-Gen Edition
        </p>
      </footer>
    </div>
  );
};

export default HomePage;
