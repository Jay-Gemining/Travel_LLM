import React, { useState } from 'react';
import axios from 'axios';

// --- Constants for Form Options ---
const ALL_INTERESTS = [
  '美食探索', '历史古迹', '自然风光', '购物血拼',
  '艺术文化', '休闲放松', '户外运动', '夜生活', '亲子时光'
];
const TRAVEL_STYLES = ['悠闲', '普通', '紧凑'];
const BUDGET_OPTIONS = ['经济', '标准', '优质'];
const CUISINE_OPTIONS = ['本地特色', '网红餐厅', '川菜', '粤菜', '西餐', '日料', '咖啡厅', '酒吧'];
const PRICE_RANGES = ['不限', '¥50-100', '¥100-200', '¥200-300', '¥300+'];

// --- Main Component ---
const HomePage = ({ setIsLoading, setError, onGenerate }) => {
  // --- State Management ---
  const [city, setCity] = useState('');
  const [days, setDays] = useState(3);
  const [interests, setInterests] = useState([]);
  const [travelStyle, setTravelStyle] = useState('普通');
  const [mustVisitPois, setMustVisitPois] = useState('');
  const [budget, setBudget] = useState('标准');
  const [foodPriceRange, setFoodPriceRange] = useState('不限');
  const [cuisineTypes, setCuisineTypes] = useState([]);
  const [dietaryRestrictions, setDietaryRestrictions] = useState('');

  // --- Event Handlers ---
  const handleToggle = (item, state, setState) => {
    setState(prev => 
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
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

    const requestPayload = {
      city,
      days,
      interests,
      travel_style: travelStyle,
      must_visit_pois: mustVisitPois.split(/,|，/).map(poi => poi.trim()).filter(Boolean),
      budget,
      food_preferences: {
        price_range: foodPriceRange,
        cuisine_types: cuisineTypes,
        dietary_restrictions: dietaryRestrictions,
      },
    };

    try {
      const response = await axios.post('/api/plan', requestPayload);
      onGenerate(requestPayload, response.data); // Pass both request and response to App
    } catch (err) {
      const errorMsg = err.response?.data?.detail || '无法连接到服务器，请检查网络或后端服务是否运行。';
      setError(errorMsg);
      console.error("API request error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Render Method ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600 flex flex-col justify-center items-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-2xl">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-2">
          你的专属AI旅行管家
        </h1>
        <p className="text-center text-gray-600 mb-8">
          输入偏好，即刻生成包含美食、景点、贴士的完整行程！
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* --- Core Travel Inputs --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField id="city" label="目的地城市" value={city} onChange={setCity} placeholder="例如：杭州" required />
            <SelectField id="days" label="旅行天数" value={days} onChange={setDays} options={[...Array(7).keys()].map(i => ({ value: i + 1, label: `${i + 1} 天` }))} />
          </div>

          {/* --- Travel Style and Budget --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <SelectField id="travelStyle" label="旅行风格" value={travelStyle} onChange={setTravelStyle} options={TRAVEL_STYLES.map(s => ({ value: s, label: s }))} />
             <SelectField id="budget" label="总体预算" value={budget} onChange={setBudget} options={BUDGET_OPTIONS.map(b => ({ value: b, label: b }))} />
          </div>

          {/* --- Interests --- */}
          <MultiSelectGrid label="旅行兴趣 (可选多个)" options={ALL_INTERESTS} selected={interests} onToggle={(interest) => handleToggle(interest, interests, setInterests)} />
          
          {/* --- Food Preferences --- */}
          <fieldset className="border-t pt-6">
            <legend className="text-lg font-semibold text-gray-800 mb-4">餐饮偏好</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SelectField id="foodPriceRange" label="人均消费" value={foodPriceRange} onChange={setFoodPriceRange} options={PRICE_RANGES.map(p => ({ value: p, label: p }))} />
              <InputField id="dietaryRestrictions" label="忌口/特殊要求 (可选)" value={dietaryRestrictions} onChange={setDietaryRestrictions} placeholder="例如：素食, 不吃辣" />
            </div>
            <MultiSelectGrid label="菜系/口味 (可选多个)" options={CUISINE_OPTIONS} selected={cuisineTypes} onToggle={(cuisine) => handleToggle(cuisine, cuisineTypes, setCuisineTypes)} />
          </fieldset>

          {/* --- Must-Visit POIs --- */}
          <InputField id="mustVisitPois" label="必游景点 (可选，用逗号分隔)" value={mustVisitPois} onChange={setMustVisitPois} placeholder="例如：西湖, 灵隐寺" />

          {/* --- Submit Button --- */}
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
          行程AIGC v1.2 - 您的智能旅行伙伴
        </p>
      </footer>
    </div>
  );
};

// --- Reusable Form Components ---
const InputField = ({ id, label, value, onChange, placeholder, required = false }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input
      type="text"
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
      required={required}
    />
  </div>
);

const SelectField = ({ id, label, value, onChange, options }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="mt-1 block w-full px-4 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </div>
);

const MultiSelectGrid = ({ label, options, selected, onToggle }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
      {options.map(option => (
        <button
          type="button"
          key={option}
          onClick={() => onToggle(option)}
          className={`px-3 py-2 text-sm rounded-lg border-2 transition-all duration-150 ${
            selected.includes(option)
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-indigo-50 hover:border-indigo-400'
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  </div>
);

export default HomePage;