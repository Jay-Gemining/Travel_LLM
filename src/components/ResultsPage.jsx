import React, { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import PoiCard from './PoiCard';
import MapView from './MapView';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import AddActivityModal from './AddActivityModal'; // Import the modal
import WeatherContingency from './WeatherContingency'; // Import the new component
import { v4 as uuidv4 } from 'uuid'; // To generate unique IDs

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
  console.log("ResultsPage received plan:", plan);
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [regeneratingActivity, setRegeneratingActivity] = useState(null);
  const [showShareFeedback, setShowShareFeedback] = useState(false);
  const [saveStatus, setSaveStatus] = useState({ loading: false, message: '' });
  const [isUpdatingItinerary, setIsUpdatingItinerary] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [weatherContingency, setWeatherContingency] = useState({ plan: null, dayIndex: -1, activityIndex: -1 });
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);

  useEffect(() => {
    if (!plan || !Array.isArray(plan.itinerary)) {
      setActiveDayIndex(0); // Reset if plan or itinerary is invalid
      return;
    }

    const numDays = plan.itinerary.length;
    if (numDays === 0) {
      setActiveDayIndex(0); // No days, so active index is 0
    } else if (activeDayIndex >= numDays) {
      setActiveDayIndex(numDays - 1); // Adjust to the last valid day
    }
  }, [plan, activeDayIndex]);

  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => { // Mark this callback as async
        await func.apply(this, args); // Await the async function
      }, delay);
    };
  };

  const debouncedUpdateItineraryApiCall = useCallback(
    debounce(async (updatedPlan) => {
      setIsUpdatingItinerary(true);
      try {
        const response = await axios.post('/api/update-itinerary', updatedPlan);
        setPlan(response.data);
      } catch (error) {
        console.error("Error updating itinerary:", error);
        alert("行程更新失败，部分信息可能未正确同步。请尝试刷新或重新规划。");
      } finally {
        setIsUpdatingItinerary(false);
      }
    }, 1500),
    [setPlan]
  );

  const handleOnDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(plan.itinerary[activeDayIndex].activities);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const updatedPlan = { ...plan };
    updatedPlan.itinerary[activeDayIndex].activities = items;

    setPlan(updatedPlan);
    debouncedUpdateItineraryApiCall(updatedPlan);
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
      
      const newItinerary = plan.itinerary.map((day, dIdx) => {
        if (dIdx === dayIndex) {
          const newActivities = day.activities.map((activity, aIdx) => {
            if (aIdx === activityIndex) {
              return newActivity;
            }
            return activity;
          });
          return { ...day, activities: newActivities };
        }
        return day;
      });
      const updatedPlan = { ...plan, itinerary: newItinerary };
      setPlan(updatedPlan);

    } catch (error) {
      console.error("Error regenerating activity:", error);
      alert("替换活动失败，请稍后再试。");
    } finally {
      setRegeneratingActivity(null);
    }
  };

  const handleDeleteActivity = (dayIndex, activityIndex) => {
    const newItinerary = plan.itinerary.map((day, dIdx) => {
      if (dIdx === dayIndex) {
        const newActivities = day.activities.filter((_, aIdx) => aIdx !== activityIndex);
        if (newActivities.length === 0) {
          return null; // Mark this day for removal
        }
        return { ...day, activities: newActivities };
      }
      return day;
    }).filter(Boolean); // Filter out null days

    const updatedPlan = { ...plan, itinerary: newItinerary };

    let newActiveDayIndex = activeDayIndex;
    if (newItinerary.length < plan.itinerary.length) {
      if (activeDayIndex === dayIndex) {
        newActiveDayIndex = Math.max(0, dayIndex - 1);
      } else if (activeDayIndex > dayIndex) {
        newActiveDayIndex = activeDayIndex - 1;
      }
    }
    setActiveDayIndex(newActiveDayIndex);

    setPlan(updatedPlan);
    debouncedUpdateItineraryApiCall(updatedPlan);
  };

  const handleTimeChange = (dayIndex, activityIndex, newTime) => {
    const newItinerary = plan.itinerary.map((day, dIdx) => {
      if (dIdx === dayIndex) {
        const newActivities = day.activities.map((activity, aIdx) => {
          if (aIdx === activityIndex) {
            return { ...activity, time: newTime };
          }
          return activity;
        });
        return { ...day, activities: newActivities };
      }
      return day;
    });
    const updatedPlan = { ...plan, itinerary: newItinerary };
    setPlan(updatedPlan);
    debouncedUpdateItineraryApiCall(updatedPlan);
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

  const handleAddActivity = (newActivityData) => {
    const newActivity = {
      ...newActivityData,
      id: uuidv4(),
      description: "手动添加的活动。",
      lat: 0, // Placeholder coordinates
      lon: 0,
      travel_from_previous: "N/A", // Will be recalculated
      opening_hours: "N/A",
      booking_info: "N/A",
      price: "N/A",
      local_tip: "N/A",
    };

    const updatedPlan = { ...plan };
    updatedPlan.itinerary[activeDayIndex].activities.push(newActivity);

    setPlan(updatedPlan);
    debouncedUpdateItineraryApiCall(updatedPlan);
  };

  const handleGetWeatherContingency = async (dayIndex, activityIndex) => {
    setIsWeatherLoading(true);
    const activityToReplace = plan.itinerary[dayIndex].activities[activityIndex];

    try {
      const response = await axios.post('/api/weather-contingency', {
        city: plan.city,
        interests: initialRequest.interests,
        activity_to_replace: activityToReplace,
      });
      setWeatherContingency({ plan: response.data, dayIndex, activityIndex });
    } catch (error) {
      console.error("Error getting weather contingency plan:", error);
      alert("获取天气备选方案失败，请稍后再试。");
    } finally {
      setIsWeatherLoading(false);
    }
  };

  const handleAcceptContingency = () => {
    const { plan: newActivity, dayIndex, activityIndex } = weatherContingency;
    const newItinerary = plan.itinerary.map((day, dIdx) => {
      if (dIdx === dayIndex) {
        const newActivities = day.activities.map((activity, aIdx) => {
          if (aIdx === activityIndex) {
            return { ...newActivity, id: activity.id }; // Keep the original ID
          }
          return activity;
        });
        return { ...day, activities: newActivities };
      }
      return day;
    });
    const updatedPlan = { ...plan, itinerary: newItinerary };
    setPlan(updatedPlan);
    setWeatherContingency({ plan: null, dayIndex: -1, activityIndex: -1 });
    debouncedUpdateItineraryApiCall(updatedPlan);
  };

  const handleDeclineContingency = () => {
    setWeatherContingency({ plan: null, dayIndex: -1, activityIndex: -1 });
  };

  if (!plan || !Array.isArray(plan.itinerary) || plan.itinerary.length === 0 || !plan.itinerary.some(day => day && day.activities && day.activities.length > 0)) {
    return (
      <div className="p-6 max-w-3xl mx-auto text-center">
        <h1 className="text-2xl font-bold text-red-500 mb-6">行程生成失败或无有效数据</h1>
        <button onClick={onReset} className="btn-primary">
          返回首页
        </button>
      </div>
    );
  }

  const currentDayData = plan?.itinerary?.[activeDayIndex] || { day: 0, activities: [] };

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
        <p className="text-center text-gray-600 mb-8">v2.0 - 支持拖拽排序和地图可视化</p>

        {/* --- Day Tabs --- */}
        {plan && Array.isArray(plan.itinerary) && plan.itinerary.length > 0 && (
          <div className="mb-8 flex flex-wrap justify-center border-b-2 border-gray-200 pb-2">
            {(plan.itinerary || [])
              .filter(dayPlan => dayPlan && typeof dayPlan === 'object' && 'day' in dayPlan) // Explicitly filter valid dayPlan objects
              .map((dayPlan, index) => {
                return (
                  <button
                    key={dayPlan.day} // Use dayPlan.day as key
                    onClick={() => setActiveDayIndex(index)}
                    className={`px-4 py-2 mx-1 my-1 rounded-md font-medium transition-colors duration-150 ${
                      activeDayIndex === index
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-blue-100'
                    }`}
                  >
                    第 {dayPlan.day} 天
                  </button>
                );
              })}
          </div>
        )}
        
        {isUpdatingItinerary && (
          <div className="fixed top-4 right-4 bg-yellow-500 text-white text-sm font-semibold py-2 px-4 rounded-lg shadow-lg z-50">
            正在同步更新行程...
          </div>
        )}

        {/* --- Activities and Map for the selected day --- */}
        {currentDayData && (
          <div className="lg:flex lg:gap-8">
            <div className="lg:w-1/2">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                第 {currentDayData.day} 天活动安排
              </h2>
              <button onClick={() => setIsAddModalOpen(true)} className="w-full mb-4 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors duration-150">
                + 添加新活动
              </button>
              <DragDropContext onDragEnd={handleOnDragEnd}>
                <Droppable droppableId="activities">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef}>
                      {currentDayData.activities?.length > 0 ? (
                        currentDayData.activities.map((activity, index) => (
                          <Draggable key={activity.id} draggableId={activity.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                              >
                                <PoiCard
                                  activity={activity}
                                  onRegenerate={() => handleRegenerate(activeDayIndex, index)}
                                  isRegenerating={regeneratingActivity?.dayIndex === activeDayIndex && regeneratingActivity?.activityIndex === index}
                                  isFirst={index === 0}
                                  onDeleteActivity={() => handleDeleteActivity(activeDayIndex, index)}
                                  onTimeChange={(newTime) => handleTimeChange(activeDayIndex, index, newTime)}
                                  onGetWeatherContingency={() => handleGetWeatherContingency(activeDayIndex, index)}
                                  isWeatherContingencyLoading={isWeatherLoading && weatherContingency.activityIndex === index}
                                />
                                {weatherContingency.plan && weatherContingency.dayIndex === activeDayIndex && weatherContingency.activityIndex === index && (
                                  <WeatherContingency 
                                    activity={weatherContingency.plan} 
                                    onAccept={handleAcceptContingency} 
                                    onDecline={handleDeclineContingency} 
                                    isLoading={isWeatherLoading}
                                  />
                                )}
                              </div>
                            )}
                          </Draggable>
                        ))
                      ) : (
                        <p className="text-gray-600">今天没有特别安排的活动。</p>
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </div>
            <div className="lg:w-1/2 mt-8 lg:mt-0">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                地图视图
              </h2>
              <MapView activities={currentDayData.activities} />
            </div>
          </div>
        )}
      </div>
      <AddActivityModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onAddActivity={handleAddActivity} 
      />
    </div>
  );
};

export default ResultsPage;
