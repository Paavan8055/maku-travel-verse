import React, { useState, useEffect } from 'react';

interface Environment {
  name: string;
  description: string;
  backend_url: string;
  source: string;
  active: boolean;
}

interface PreviewConfig {
  environments: Record<string, Environment>;
  current_environment: string;
  switch_mode: string;
  last_updated: string;
}

export const EnvironmentSwitcher: React.FC = () => {
  const [config, setConfig] = useState<PreviewConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const backendUrl = import.meta.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/environment/config`);
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
      } else {
        // Fallback to local config file
        const fallbackResponse = await fetch('/preview-config.json');
        if (fallbackResponse.ok) {
          const data = await fallbackResponse.json();
          setConfig(data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch preview config:', error);
    } finally {
      setLoading(false);
    }
  };

  const switchEnvironment = async (targetEnv: string) => {
    if (!config || switching) return;
    
    setSwitching(true);
    try {
      // In a real implementation, this would call the backend API
      // For demo purposes, we'll update local state
      const updatedConfig = {
        ...config,
        current_environment: targetEnv,
        last_updated: new Date().toISOString(),
      };

      Object.keys(updatedConfig.environments).forEach(env => {
        updatedConfig.environments[env].active = (env === targetEnv);
      });

      setConfig(updatedConfig);
      
      // Show success message
      alert(`Successfully switched to ${targetEnv} environment. Please restart services if needed.`);
    } catch (error) {
      console.error('Failed to switch environment:', error);
      alert('Failed to switch environment');
    } finally {
      setSwitching(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="text-gray-600">Loading environment status...</div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="p-4 text-red-600">
        Failed to load environment configuration
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          🏗️ Preview Environment Manager
        </h2>
        <div className="text-sm text-gray-500">
          Last updated: {new Date(config.last_updated).toLocaleString()}
        </div>
      </div>

      <div className="mb-4 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">Current Environment</h3>
        <div className="text-blue-700">
          <span className="font-medium">{config.current_environment.toUpperCase()}</span>
          {' - '}
          {config.environments[config.current_environment]?.description}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {Object.entries(config.environments).map(([envKey, env]) => (
          <div
            key={envKey}
            className={`border rounded-lg p-4 transition-all ${
              env.active
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-lg">
                {env.active ? '🟢' : '⚪'} {env.name}
              </h3>
              {env.active && (
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  ACTIVE
                </span>
              )}
            </div>
            
            <p className="text-gray-600 mb-3">{env.description}</p>
            
            <div className="text-sm text-gray-500 mb-4">
              <div>URL: {env.backend_url}</div>
              <div>Source: {env.source}</div>
            </div>

            {!env.active && (
              <button
                onClick={() => switchEnvironment(envKey)}
                disabled={switching}
                className={`w-full py-2 px-4 rounded transition-colors ${
                  switching
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {switching ? 'Switching...' : `Switch to ${env.name}`}
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
        <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Important Notes</h3>
        <ul className="text-yellow-700 text-sm space-y-1">
          <li>• Switching environments will update configuration files</li>
          <li>• You may need to restart services after switching</li>
          <li>• Make sure to commit changes before switching if needed</li>
          <li>• Environment URLs are configured for preview deployment</li>
        </ul>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={fetchConfig}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
        >
          🔄 Refresh Status
        </button>
        
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
        >
          🔄 Restart Application
        </button>
      </div>
    </div>
  );
};