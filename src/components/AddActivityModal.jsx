import React, { useState } from 'react';

const CATEGORIES = ['景点', '美食', '购物', '体验'];

const AddActivityModal = ({ isOpen, onClose, onAddActivity }) => {
  const [poiName, setPoiName] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [time, setTime] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!poiName.trim() || !time.trim()) {
      alert('请填写活动名称和时间。');
      return;
    }
    onAddActivity({ poiName, category, time });
    // Reset form and close
    setPoiName('');
    setCategory(CATEGORIES[0]);
    setTime('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" onClick={onClose}>
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-4">添加新活动</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="poiName" className="block text-sm font-medium text-gray-700">活动名称</label>
            <input
              type="text"
              id="poiName"
              value={poiName}
              onChange={(e) => setPoiName(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="例如：故宫"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="time" className="block text-sm font-medium text-gray-700">时间</label>
            <input
              type="text"
              id="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="例如：下午 (14:00-16:00)"
              required
            />
          </div>
          <div className="mb-6">
            <label htmlFor="category" className="block text-sm font-medium text-gray-700">类别</label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            >
              {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-4">
            <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-gray-300 transition-colors duration-150">取消</button>
            <button type="submit" className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-150">确认添加</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddActivityModal;
