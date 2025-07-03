import React, { useState } from 'react';
import HomePage from './components/HomePage';
import ResultsPage from './components/ResultsPage';
import LoadingSpinner from './components/LoadingSpinner';

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [plan, setPlan] = useState(null);
  const [initialRequest, setInitialRequest] = useState(null); // Save the initial request parameters

  const handleReset = () => {
    setPlan(null);
    setError(null);
    setIsLoading(false);
    setInitialRequest(null);
  };

  const handleGenerate = (request, response) => {
    setInitialRequest(request);
    setPlan(response);
    setIsLoading(false);
    setError(null);
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-red-50 p-4">
        <div className="bg-white p-8 rounded-lg shadow-xl text-center max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">An Error Occurred</h2>
          <p className="text-gray-700 mb-6">{error}</p>
          <button
            onClick={handleReset}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-150"
          >
            Return to Homepage
          </button>
        </div>
      </div>
    );
  }

  if (plan) {
    return <ResultsPage plan={plan} setPlan={setPlan} onReset={handleReset} initialRequest={initialRequest} />;
  }

  return (
    <HomePage
      setIsLoading={setIsLoading}
      setError={setError}
      onGenerate={handleGenerate}
    />
  );
}

export default App;