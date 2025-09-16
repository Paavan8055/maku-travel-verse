import React from 'react';
import { EnvironmentSwitcher } from '../components/EnvironmentSwitcher';

export const EnvironmentManager: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Maku.Travel Environment Manager
          </h1>
          <p className="text-gray-600">
            Switch between Lovable and Emergent preview environments
          </p>
        </div>

        <EnvironmentSwitcher />

        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            🛠️ Environment Management Commands
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">CLI Commands</h3>
              <div className="bg-gray-100 rounded p-4 font-mono text-sm">
                <div className="mb-2"># Switch to lovable environment</div>
                <div className="text-blue-600 mb-4">node scripts/switch-environment.js lovable</div>
                
                <div className="mb-2"># Switch to emergent environment</div>
                <div className="text-blue-600 mb-4">node scripts/switch-environment.js emergent</div>
                
                <div className="mb-2"># Check current status</div>
                <div className="text-blue-600">./scripts/preview-status.sh</div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Deployment Commands</h3>
              <div className="bg-gray-100 rounded p-4 font-mono text-sm">
                <div className="mb-2"># Deploy lovable environment</div>
                <div className="text-green-600 mb-4">./scripts/deploy-environment.sh lovable</div>
                
                <div className="mb-2"># Deploy emergent environment</div>
                <div className="text-green-600 mb-4">./scripts/deploy-environment.sh emergent</div>
                
                <div className="mb-2"># Restart all services</div>
                <div className="text-green-600">sudo supervisorctl restart all</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            📋 Environment Descriptions
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="border border-blue-200 rounded-lg p-4">
              <h3 className="font-bold text-blue-800 mb-2">🟦 Lovable State</h3>
              <ul className="text-gray-700 text-sm space-y-1">
                <li>• Original application state</li>
                <li>• Current features and implementations</li>
                <li>• Stable baseline for comparison</li>
                <li>• Production-ready state</li>
              </ul>
            </div>

            <div className="border border-purple-200 rounded-lg p-4">
              <h3 className="font-bold text-purple-800 mb-2">🟣 Emergent State</h3>
              <ul className="text-gray-700 text-sm space-y-1">
                <li>• Enhanced with CTO recommendations</li>
                <li>• Performance optimizations</li>
                <li>• New revenue stream features</li>
                <li>• Improved architecture</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};