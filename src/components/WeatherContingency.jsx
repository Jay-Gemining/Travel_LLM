import React from 'react';

const WeatherContingency = ({ activity, onAccept, onDecline, isLoading }) => {
  if (!activity) return null;

  return (
    <div className="bg-blue-100 border-t-4 border-blue-500 rounded-b text-blue-900 px-4 py-3 shadow-md my-4" role="alert">
      <div className="flex">
        <div className="py-1"><svg className="fill-current h-6 w-6 text-blue-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M10 20a10 10 0 1 1 0-20 10 10 0 0 1 0 20zm-1-11V5h2v4h-2zm0 6v-2h2v2h-2z"/></svg></div>
        <div>
          <p className="font-bold">恶劣天气备选方案</p>
          <p className="text-sm">如果天气不佳，可以考虑用以下活动替换：</p>
          <div className="mt-2 font-semibold">{activity.poi_name}</div>
          <p className="text-xs">{activity.description}</p>
          <div className="mt-3">
            <button 
              onClick={onAccept} 
              disabled={isLoading}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-xs mr-2 disabled:opacity-50"
            >
              {isLoading ? '处理中...' : '接受'}
            </button>
            <button 
              onClick={onDecline} 
              disabled={isLoading}
              className="bg-transparent hover:bg-blue-200 text-blue-700 font-semibold py-1 px-3 border border-blue-500 rounded text-xs disabled:opacity-50"
            >
              忽略
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherContingency;
