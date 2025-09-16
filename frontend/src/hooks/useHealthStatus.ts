import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'down'
  services: {
    database: { status: string; responseTime: number }
    amadeus: { status: string; responseTime: number }
    stripe: { status: string; responseTime: number }
    supabase: { status: string; responseTime: number }
  }
  timestamp: number
}

export const useHealthStatus = () => {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const checkHealth = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase.functions.invoke('health-check')
      
      if (error) throw error
      
      setHealthStatus(data)
    } catch (error) {
      console.error('Health check failed:', error)
      setHealthStatus({
        status: 'down',
        services: {
          database: { status: 'down', responseTime: 0 },
          amadeus: { status: 'down', responseTime: 0 },
          stripe: { status: 'down', responseTime: 0 },
          supabase: { status: 'down', responseTime: 0 }
        },
        timestamp: Date.now()
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    checkHealth()
    // Check health every 30 seconds
    const interval = setInterval(checkHealth, 30000)
    return () => clearInterval(interval)
  }, [])

  return {
    healthStatus,
    isLoading,
    checkHealth
  }
}