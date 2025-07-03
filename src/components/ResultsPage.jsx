import React, { useState } from 'react';
import axios from 'axios';
import PoiCard from './PoiCard';

// --- Helper Functions ---
const copyToClipboard = (text, onSuccess) => {
  navigator.clipboard.writeText(text).then(() => {
    onSuccess();
  }).catch(err => {
    console.error('Failed to copy text: ', err);
    alert('复制失败!');
  });
};

const generateShareableText = (plan) => {
  let text = `【我的${plan.city}${plan.total_days}日行程规划】\n\n`;
  plan.itinerary.forEach(day => {
    text += `--- 第 ${day.day} 天 ---\n`;
    day.activities.forEach(act => {
      text += `\n[${act.time}] ${act.poi_name} (${act.category})\n`;
      text += `  - 简介: ${act.description}\n`;
      if (act.price !== 'N/A') text += `  - 价格: ${act.price}\n`;
      if (act.opening_hours !== 'N/A') text += `  - 时间: ${act.opening_hours}\n`;
    });
    text += '\n';
  });
  text += '由 行程AIGC 生成';
  return text;
};


// --- Main Component ---
const ResultsPage = ({ plan, setPlan, onReset, initialRequest }) => {
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [regeneratingActivity, setRegeneratingActivity] = useState(null);
  const [showShareFeedback, setShowShareFeedback] = useState(false);
  const [saveStatus, setSaveStatus] = useState({ loading: false, message: '' });

  const handleRegenerate = async (dayIndex, activityIndex) => {
    setRegeneratingActivity({ dayIndex, activityIndex });
    const dayPlan = plan.itinerary[dayIndex];
    const activityToReplace = dayPlan.activities[activityIndex];

    try {
      const response = await axios.post('/api/regenerate-activity', {
        ...initialRequest,
        day_plan: dayPlan,
        activity_to_replace: activityToReplace,
      });
      const newActivity = response.data;
      
      const updatedPlan = { ...plan };
      updatedPlan.itinerary[dayIndex].activities[activityIndex] = newActivity;
      setPlan(updatedPlan);

    } catch (error) {
      console.error("Error regenerating activity:", error);
      alert("替换活动失败，请稍后再试。");
    } finally {
      setRegeneratingActivity(null);
    }
  };

  const handleSave = async () => {
    setSaveStatus({ loading: true, message: '' });
    try {
      const response = await axios.post('/api/save-itinerary', plan);
      setSaveStatus({ loading: false, message: response.data.message || '保存成功！' });
    } catch (error) {
      const errorMsg = error.response?.data?.detail || '保存失败，请稍后再试。';
      setSaveStatus({ loading: false, message: errorMsg });
    } finally {
      setTimeout(() => setSaveStatus({ loading: false, message: '' }), 3000);
    }
  };

  const handleShare = () => {
    const textToCopy = generateShareableText(plan);
    copyToClipboard(textToCopy, () => {
      setShowShareFeedback(true);
      setTimeout(() => setShowShareFeedback(false), 2000);
    });
  };

  if (!plan?.itinerary?.length) {
    return (
      <div className="p-6 max-w-3xl mx-auto text-center">
        <h1 className="text-2xl font-bold text-red-500 mb-6">行程生成失败或无有效数据</h1>
        <button onClick={onReset} className="btn-primary">
          返回首页
        </button>
      </div>
    );
  }

  const currentDayData = plan.itinerary[activeDayIndex];

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        {/* --- Header and Actions --- */}
        <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
          <button onClick={onReset} className="btn-secondary">
            &larr; 返回重新规划
          </button>
          <div className="flex items-center gap-2">
            <button onClick={handleSave} className="btn-primary" disabled={saveStatus.loading}>
              {saveStatus.loading ? '保存中...' : '💾 保存行程'}
            </button>
            <button onClick={handleShare} className="btn-secondary">
              🔗 分享
            </button>
          </div>
        </div>
        {saveStatus.message && <div className="text-center mb-4 font-semibold text-green-600">{saveStatus.message}</div>}
        {showShareFeedback && <div className="text-center mb-4 font-semibold text-green-600">行程已复制到剪贴板！</div>}

        {/* --- Itinerary Title --- */}
        <h1 className="text-3xl md:text-4xl font-bold text-center text-blue-800 mb-2">
          您的 <span className="text-green-600">{plan.city}</span> {plan.total_days}日专属行程
        </h1>
        <p className="text-center text-gray-600 mb-8">v1.2 - 根据您的预算和餐饮偏好精心策划</p>

        {/* --- Day Tabs --- */}
        {plan.itinerary.length > 1 && (
          <div className="mb-8 flex flex-wrap justify-center border-b-2 border-gray-200 pb-2">
            {plan.itinerary.map((dayPlan, index) => (
              <button
                key={dayPlan.day}
                onClick={() => setActiveDayIndex(index)}
                className={`px-4 py-2 mx-1 my-1 rounded-md font-medium transition-colors duration-150 ${
                  activeDayIndex === index
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-blue-100'
                }`}
              >
                第 {dayPlan.day} 天
              </button>
            ))}
          </div>
        )}

        {/* --- Activities for the selected day --- */}
        {currentDayData && (
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              第 {currentDayData.day} 天活动安排
            </h2>
            {currentDayData.activities?.length > 0 ? (
              currentDayData.activities.map((activity, index) => (
                <PoiCard
                  key={`${currentDayData.day}-${index}-${activity.poi_name}`}
                  activity={activity}
                  onRegenerate={() => handleRegenerate(activeDayIndex, index)}
                  isRegenerating={regeneratingActivity?.dayIndex === activeDayIndex && regeneratingActivity?.activityIndex === index}
                  isFirst={index === 0}
                />
              ))
            ) : (
              <p className="text-gray-600">今天没有特别安排的活动。</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultsPage;