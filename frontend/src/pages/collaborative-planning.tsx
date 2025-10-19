import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { CollaborativePlanning } from '@/components/collaborative/CollaborativePlanning';

export default function CollaborativePlanningPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Hero Section */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Plan Your Trip <span className="text-orange-500">Together</span>
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto px-4">
            Collaborate with friends, vote on destinations, pool budgets, and make travel planning fun and democratic.
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto">
          <CollaborativePlanning />
        </div>

        {/* Benefits Section */}
        <div className="mt-16 sm:mt-20 max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-8 sm:mb-12">
            Why Plan Together?
          </h2>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">👥</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Better Decisions</h3>
              <p className="text-sm text-gray-700">
                Everyone gets a say in where to go and what to do
              </p>
            </div>

            <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">💰</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Fair Budget</h3>
              <p className="text-sm text-gray-700">
                Track contributions and expenses transparently
              </p>
            </div>

            <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
              <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">⚡</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Real-time Updates</h3>
              <p className="text-sm text-gray-700">
                See changes instantly as friends add ideas
              </p>
            </div>

            <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl">
              <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🗳️</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Democratic Voting</h3>
              <p className="text-sm text-gray-700">
                Vote on destinations and activities together
              </p>
            </div>

            <div className="text-center p-6 bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl">
              <div className="w-16 h-16 bg-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">💳</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Pool Resources</h3>
              <p className="text-sm text-gray-700">
                Combine travel funds for better deals
              </p>
            </div>

            <div className="text-center p-6 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl">
              <div className="w-16 h-16 bg-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">✅</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Easy Coordination</h3>
              <p className="text-sm text-gray-700">
                No more endless group chats and confusion
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
