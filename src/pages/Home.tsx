import React from "react";

const Home: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          Welcome to Kuri
        </h1>
        <p className="text-lg text-gray-700">
          Your decentralized platform for secure and efficient transactions.
        </p>
      </div>
    </div>
  );
};

export default Home;
