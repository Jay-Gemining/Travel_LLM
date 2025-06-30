import React from 'react';

const PoiCard = ({ time, poi_name, description, type }) => {
  // Basic icon/color mapping based on type
  const typeStyles = {
    '景点': { icon: '🏞️', color: 'bg-blue-100', textColor: 'text-blue-800' },
    '美食': { icon: '🍜', color: 'bg-red-100', textColor: 'text-red-800' },
    '购物': { icon: '🛍️', color: 'bg-purple-100', textColor: 'text-purple-800' },
    '体验': { icon: '🎭', color: 'bg-yellow-100', textColor: 'text-yellow-800' },
    '交通': { icon: '🚗', color: 'bg-gray-100', textColor: 'text-gray-800' },
    'default': { icon: '📍', color: 'bg-gray-100', textColor: 'text-gray-800' }
  };

  const currentTypeStyle = typeStyles[type] || typeStyles['default'];

  return (
    <div className="bg-white p-4 rounded-lg shadow-md mb-4">
      <div className="flex justify-between items-start mb-1">
        <p className="text-sm text-gray-500">{time}</p>
        <span
          className={`text-xs font-semibold px-2 py-1 rounded-full ${currentTypeStyle.color} ${currentTypeStyle.textColor}`}
        >
          {currentTypeStyle.icon} {type}
        </span>
      </div>
      <h3 className="text-lg font-bold text-blue-700 mb-1">{poi_name}</h3>
      <p className="mt-2 text-sm text-gray-700">{description}</p>
    </div>
  );
};

export default PoiCard;
