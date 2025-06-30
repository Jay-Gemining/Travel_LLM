import React, { useState } from 'react';
import PoiCard from './PoiCard';

const ResultsPage = ({ plan, onReset }) => {
  const [activeDayIndex, setActiveDayIndex] = useState(0);

  if (!plan || !plan.itinerary || plan.itinerary.length === 0) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-center text-red-500 mb-6">
          行程生成失败或无有效数据
        </h1>
        <button
          onClick={onReset}
          className="block mx-auto bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          返回首页
        </button>
      </div>
    );
  }

  const currentDayData = plan.itinerary[activeDayIndex];

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <button
          onClick={onReset}
          className="mb-6 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg shadow transition duration-150 ease-in-out"
        >
          &larr; 返回重新规划
      </button>
      <h1 className="text-3xl font-bold text-center text-blue-700 mb-2">
        您的 <span className="text-green-600">{plan.city}</span> {plan.total_days}日专属行程
      </h1>
      <p className="text-center text-gray-600 mb-6">根据您的兴趣精心策划</p>

      {plan.itinerary.length > 1 && (
        <div className="mb-6 flex flex-wrap justify-center border-b-2 border-gray-200 pb-2">
          {plan.itinerary.map((dayPlan, index) => (
            <button
              key={dayPlan.day}
              onClick={() => setActiveDayIndex(index)}
              className={`px-4 py-2 mx-1 my-1 rounded-md font-medium transition-colors duration-150
                ${activeDayIndex === index
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-blue-100'
                }`}
            >
              第 {dayPlan.day} 天
            </button>
          ))}
        </div>
      )}

      {currentDayData && (
        <div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            第 {currentDayData.day} 天活动安排
          </h2>
          {currentDayData.activities && currentDayData.activities.length > 0 ? (
            currentDayData.activities.map((activity, index) => (
              <PoiCard
                key={index} // In a real app, prefer a stable ID if available
                time={activity.time}
                poi_name={activity.poi_name}
                description={activity.description}
                type={activity.type}
              />
            ))
          ) : (
            <p className="text-gray-600">今天没有特别安排的活动。</p>
          )}
        </div>
      )}
    </div>
  );
};

export default ResultsPage;
