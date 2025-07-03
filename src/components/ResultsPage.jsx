import React, { useState } from 'react';
import axios from 'axios';
import PoiCard from './PoiCard';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { v4 as uuidv4 } from 'uuid'; // For generating IDs for new items

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
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItemForm, setNewItemForm] = useState({ dayIndex: 0, poi_name: '', category: '景点', time: 'N/A', description: '' });

  const handleDeleteItem = (dayIndex, itemId) => {
    const updatedPlan = { ...plan };
    updatedPlan.itinerary[dayIndex].activities = updatedPlan.itinerary[dayIndex].activities.filter(act => act.id !== itemId);
    setPlan(updatedPlan);
  };

  const onDragEnd = (result) => {
    const { source, destination, draggableId } = result;

    // Dropped outside the list
    if (!destination) {
      return;
    }

    const sourceDayIndex = parseInt(source.droppableId.split('-')[1]);
    const destDayIndex = parseInt(destination.droppableId.split('-')[1]);

    const updatedPlan = { ...plan };
    const sourceDayActivities = Array.from(updatedPlan.itinerary[sourceDayIndex].activities);
    const [movedActivity] = sourceDayActivities.splice(source.index, 1);

    if (sourceDayIndex === destDayIndex) {
      // Moved within the same day
      sourceDayActivities.splice(destination.index, 0, movedActivity);
      updatedPlan.itinerary[sourceDayIndex].activities = sourceDayActivities;
    } else {
      // Moved to a different day
      const destDayActivities = Array.from(updatedPlan.itinerary[destDayIndex].activities);
      destDayActivities.splice(destination.index, 0, movedActivity);
      updatedPlan.itinerary[sourceDayIndex].activities = sourceDayActivities;
      updatedPlan.itinerary[destDayIndex].activities = destDayActivities;
    }
    setPlan(updatedPlan);
  };

  const openAddModal = (dayIndex) => {
    setNewItemForm({ dayIndex, poi_name: '', category: '景点', time: 'N/A', description: '' });
    setShowAddModal(true);
  };

  const closeAddModal = () => {
    setShowAddModal(false);
  };

  const handleNewItemChange = (e) => {
    const { name, value } = e.target;
    setNewItemForm(prev => ({ ...prev, [name]: value }));
  };

  const handleAddNewItem = (e) => {
    e.preventDefault();
    const { dayIndex, ...newItemData } = newItemForm;
    if (!newItemData.poi_name.trim()) {
      alert("请输入活动名称。");
      return;
    }

    const newItem = {
      ...newItemData,
      id: uuidv4(), // Generate new ID
      lat: 0, // Default values, not editable in this basic form
      lon: 0,
      travel_from_previous: "N/A",
      opening_hours: "N/A",
      booking_info: "N/A",
      price: "N/A",
      local_tip: "N/A",
    };

    const updatedPlan = { ...plan };
    // Ensure activities array exists
    if (!updatedPlan.itinerary[dayIndex].activities) {
        updatedPlan.itinerary[dayIndex].activities = [];
    }
    updatedPlan.itinerary[dayIndex].activities.push(newItem);
    setPlan(updatedPlan);
    closeAddModal();
  };

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
        <DragDropContext onDragEnd={onDragEnd}>
          {currentDayData && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-gray-800">
                  第 {currentDayData.day} 天活动安排
                </h2>
                <button onClick={() => openAddModal(activeDayIndex)} className="btn-primary text-sm">
                  + 添加活动
                </button>
              </div>

              <Droppable droppableId={`day-${activeDayIndex}`} type="ACTIVITY">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`min-h-[200px] rounded-md p-2 ${snapshot.isDraggingOver ? 'bg-blue-50' : 'bg-gray-100'}`}
                  >
                    {currentDayData.activities?.length > 0 ? (
                      currentDayData.activities.map((activity, index) => (
                        <Draggable key={activity.id} draggableId={activity.id} index={index}>
                          {(provided, snapshot) => (
                            <PoiCard
                              innerRef={provided.innerRef}
                              draggableProps={provided.draggableProps}
                              dragHandleProps={provided.dragHandleProps}
                              activity={activity}
                              onRegenerate={() => handleRegenerate(activeDayIndex, index)}
                              onDelete={() => handleDeleteItem(activeDayIndex, activity.id)}
                              isRegenerating={regeneratingActivity?.dayIndex === activeDayIndex && regeneratingActivity?.activityIndex === index}
                              isFirst={index === 0}
                            />
                          )}
                        </Draggable>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center pt-10">今天没有特别安排的活动。拖拽活动到这里或点击上方添加。</p>
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          )}
        </DragDropContext>
      </div>

      {/* Add New Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">添加新活动到第 {newItemForm.dayIndex + 1} 天</h3>
            <form onSubmit={handleAddNewItem} className="space-y-4">
              <div>
                <label htmlFor="poi_name" className="block text-sm font-medium text-gray-700">活动名称*</label>
                <input type="text" name="poi_name" id="poi_name" value={newItemForm.poi_name} onChange={handleNewItemChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"/>
              </div>
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700">类别</label>
                <select name="category" id="category" value={newItemForm.category} onChange={handleNewItemChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500">
                  {['景点', '美食', '购物', '体验', '交通'].map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="time" className="block text-sm font-medium text-gray-700">时间</label>
                <input type="text" name="time" id="time" value={newItemForm.time} onChange={handleNewItemChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"/>
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">简介</label>
                <textarea name="description" id="description" value={newItemForm.description} onChange={handleNewItemChange} rows="3" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"></textarea>
              </div>
              <div className="flex justify-end space-x-3">
                <button type="button" onClick={closeAddModal} className="btn-secondary">取消</button>
                <button type="submit" className="btn-primary">添加</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultsPage;