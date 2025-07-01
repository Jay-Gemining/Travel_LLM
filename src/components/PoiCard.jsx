import React from 'react';

const PoiCard = ({ activity, onRegenerate, isRegenerating, isFirst }) => {
  const { time, poi_name, description, type, travel_from_previous } = activity;

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
    <div className={`bg-white p-4 rounded-lg shadow-md mb-4 relative transition-all duration-300 ${isRegenerating ? 'opacity-50' : ''}`}>
      {!isFirst && travel_from_previous && travel_from_previous !== "N/A" && (
        <div className="absolute -top-3 left-4 bg-gray-600 text-white text-xs font-semibold px-2 py-1 rounded-full shadow-lg">
          {`↓ ${travel_from_previous}`}
        </div>
      )}

      <div className="flex justify-between items-start mb-1">
        <p className="text-sm text-gray-500 font-medium">{time}</p>
        <span
          className={`text-xs font-semibold px-2 py-1 rounded-full ${currentTypeStyle.color} ${currentTypeStyle.textColor}`}>
          {currentTypeStyle.icon} {type}
        </span>
      </div>
      <h3 className="text-lg font-bold text-blue-700 mb-1">{poi_name}</h3>
      <p className="mt-2 text-sm text-gray-700">{description}</p>

      <div className="absolute bottom-2 right-2">
        <button 
          onClick={onRegenerate}
          disabled={isRegenerating}
          className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="换一个活动"
        >
          {isRegenerating ? (
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M15.312 11.227c.402.195.832.31 1.27.365V10.5a.5.5 0 00-.5-.5h-2.5a.5.5 0 00-.5.5v5a.5.5 0 00.5.5h.504a8.01 8.01 0 01-1.41 1.418l.707.707a8.963 8.963 0 001.99-1.99l.001-.002c.4-.4.756-.845 1.062-1.326H19.5a.5.5 0 00.5-.5v-2.5a.5.5 0 00-.5-.5h-1.05a6.995 6.995 0 00-3.138-1.152zM4.688 8.773a6.995 6.995 0 003.138 1.152V11.5a.5.5 0 00.5.5h2.5a.5.5 0 00.5-.5v-5a.5.5 0 00-.5-.5h-.504a8.01 8.01 0 011.41-1.418l-.707-.707a8.963 8.963 0 00-1.99 1.99l-.001.002c-.4.4-.756.845-1.062 1.326H.5a.5.5 0 00-.5.5v2.5a.5.5 0 00.5.5h1.051z" clipRule="evenodd" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};

export default PoiCard;
