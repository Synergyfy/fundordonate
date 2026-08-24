import { Routes, Route } from "react-router-dom";

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route
          path="/"
          element={
            <div className="flex min-h-screen items-center justify-center">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-900">
                  FundorDonate
                </h1>
                <p className="mt-2 text-lg text-gray-600">
                  Crowdfunding & Donation Platform
                </p>
                <p className="mt-4 text-sm text-gray-400">
                  Phase 1.1 - Project Scaffolding Complete
                </p>
              </div>
            </div>
          }
        />
      </Routes>
    </div>
  );
}

export default App;
