import React, { useState } from 'react';
import HomePage from './components/HomePage';
import ResultsPage from './components/ResultsPage';
import LoadingSpinner from './components/LoadingSpinner';
// Assuming Tailwind CSS is set up globally, e.g., in index.css or main.css
// import './index.css'; // Or your main Tailwind CSS entry point

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null); // Stores error messages (string or null)
  const [plan, setPlan] = useState(null);   // Will hold the itinerary JSON

  const handleReset = () => {
    setPlan(null);
    setError(null);
    setIsLoading(false); // Ensure loading is also reset
  };

  // Render logic based on state
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Display error prominently if it exists, with a way to go back
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-red-50 p-4">
        <div className="bg-white p-8 rounded-lg shadow-xl text-center max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">发生错误</h2>
          <p className="text-gray-700 mb-6">{error}</p>
          <button
            onClick={handleReset}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-150"
          >
            返回首页重试
          </button>
        </div>
      </div>
    );
  }

  if (plan) {
    return <ResultsPage plan={plan} onReset={handleReset} />;
  }

  // Default to HomePage
  return (
    <HomePage
      setIsLoading={setIsLoading}
      setError={setError}
      setPlan={setPlan}
    />
  );
}

export default App;
