import React from 'react';

// --- Helper Functions and Constants ---
const CATEGORY_STYLES = {
  '景点': { icon: '🏞️', color: 'blue', },
  '美食': { icon: '🍜', color: 'red', },
  '购物': { icon: '🛍️', color: 'purple', },
  '体验': { icon: '🎭', color: 'yellow', },
  '交通': { icon: '🚗', color: 'gray', },
  'default': { icon: '📍', color: 'gray', },
};

const getCategoryStyle = (category) => CATEGORY_STYLES[category] || CATEGORY_STYLES['default'];

// --- Sub-components for Readability ---
const CardHeader = ({ time, category, onTimeChange }) => {
  const style = getCategoryStyle(category);
  // Basic state for inline editing of time
  const [editedTime, setEditedTime] = React.useState(time);
  const [isEditingTime, setIsEditingTime] = React.useState(false);

  React.useEffect(() => { // Ensure editedTime updates if prop `time` changes from parent
    setEditedTime(time);
  }, [time]);

  const handleTimeBlur = () => {
    setIsEditingTime(false);
    if (editedTime !== time && editedTime.trim() !== "") { // Prevent empty time
      onTimeChange(editedTime);
    } else {
      setEditedTime(time); // Revert to original if empty or unchanged
    }
  };

  const handleTimeKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent form submission if any
      handleTimeBlur();
    } else if (e.key === 'Escape') {
      setEditedTime(time); // Revert changes
      setIsEditingTime(false);
    }
  };

  return (
    <div className="flex justify-between items-center mb-2"> {/* items-center for better alignment */}
      {isEditingTime ? (
        <input
          type="text"
          value={editedTime}
          onChange={(e) => setEditedTime(e.target.value)}
          onBlur={handleTimeBlur}
          onKeyDown={handleTimeKeyDown}
          className="text-sm text-gray-700 font-medium border border-blue-300 rounded px-1 py-0.5 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 w-auto flex-grow mr-2" // Added flex-grow and mr-2
          autoFocus
          onClick={(e) => e.stopPropagation()} // Prevent card click-through
        />
      ) : (
        <p 
          className="text-sm text-gray-500 font-medium cursor-pointer hover:bg-gray-100 p-0.5 rounded"
          onClick={(e) => {
            e.stopPropagation(); // Prevent card click-through
            setIsEditingTime(true);
          }}
          title="点击编辑时间"
        >
          {time}
        </p>
      )}
      <span
        className={`text-xs font-semibold px-2 py-1 rounded-full bg-${style.color}-100 text-${style.color}-800 whitespace-nowrap`}> {/* Added whitespace-nowrap */}
        {style.icon} {category}
      </span>
    </div>
  );
};

const InfoRow = ({ icon, label, value }) => (
  value && value !== "N/A" && (
    <div className="flex items-start text-sm text-gray-600 mt-2">
      <span className="w-5 text-center mr-2">{icon}</span>
      <span className="font-semibold">{label}:</span>
      <span className="ml-2 flex-1 break-words">{value}</span> {/* Added break-words */}
    </div>
  )
);

const LocalTip = ({ tip }) => (
  tip && tip !== "N/A" && (
    <div className="mt-3 pt-3 border-t border-gray-200">
      <p className="text-sm text-yellow-800 bg-yellow-50 p-2 rounded-lg break-words"> {/* Added break-words */}
        <span className="font-bold">💡 当地人贴士:</span> {tip}
      </p>
    </div>
  )
);

const ActionButton = ({ onClick, disabled, ariaLabel, children, colorClass = "gray", title }) => (
  <button
    onClick={(e) => {
      e.stopPropagation(); // Prevent card click-through
      onClick(e);
    }}
    disabled={disabled}
    className={`p-1.5 rounded-full bg-${colorClass}-100 hover:bg-${colorClass}-200 text-${colorClass}-600 hover:text-${colorClass}-900 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed`}
    aria-label={ariaLabel}
    title={title || ariaLabel}
  >
    {children}
  </button>
);

const RegenerateButton = ({ onRegenerate, isRegenerating }) => (
  <ActionButton
    onClick={onRegenerate}
    disabled={isRegenerating}
    ariaLabel="换一个活动建议"
    title="换一个活动建议"
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
    </ActionButton>
);

const DeleteButton = ({ onDelete }) => (
  <ActionButton
    onClick={onDelete}
    ariaLabel="删除此活动"
    title="删除此活动"
    colorClass="red"
  >
    <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
  </ActionButton>
);


// --- Main POI Card Component ---
const PoiCard = ({ 
  activity, 
  onRegenerate, 
  isRegenerating, 
  isFirst,
  onDeleteActivity, // New prop
  onTimeChange,     // New prop
  provided,
  snapshot
}) => {
  const { 
    time, poi_name, description, category, travel_from_previous, 
    opening_hours, booking_info, price, local_tip 
  } = activity;

  const style = getCategoryStyle(category);

  // Handler for time change, ensures the prop function is called.
  const handleTimeChange = (newTime) => {
    if (onTimeChange) {
      onTimeChange(newTime);
    }
  };

  return (
    <div className={`bg-white p-4 rounded-lg shadow-md mb-4 relative transition-all duration-300 border-l-4 border-${style.color}-500 ${isRegenerating ? 'opacity-50' : ''}`}>
      {!isFirst && travel_from_previous && travel_from_previous !== "N/A" && (
        <div className="absolute -top-3 left-4 bg-gray-600 text-white text-xs font-semibold px-2 py-1 rounded-full shadow-lg z-10">
          {`↓ ${travel_from_previous}`}
        </div>
      )}

      <CardHeader time={time} category={category} onTimeChange={handleTimeChange} />
      
      <h3 className={`text-xl font-bold text-${style.color}-700 mb-2 break-words`}>{poi_name}</h3> {/* Added break-words */}
      <p className="text-sm text-gray-800 mb-3 break-words">{description}</p> {/* Added break-words */}

      <InfoRow icon="⏰" label="开放时间" value={opening_hours} />
      <InfoRow icon="💰" label="价格" value={price} />
      <InfoRow icon="📞" label="预订" value={booking_info} />

      <LocalTip tip={local_tip} />

      {/* Action buttons container */}
      <div className="absolute bottom-3 right-3 flex items-center space-x-2">
        {onRegenerate && <RegenerateButton onRegenerate={onRegenerate} isRegenerating={isRegenerating} />}
        {onDeleteActivity && <DeleteButton onDelete={onDeleteActivity} />}
      </div>
    </div>
  );
};

export default PoiCard;