import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Clock, Users, TrendingUp, Zap } from "lucide-react"
import { useState, useEffect } from "react"

interface UrgencyIndicatorProps {
  type: 'rooms_left' | 'high_demand' | 'recently_booked' | 'price_drop'
  value?: number
  className?: string
}

export const UrgencyIndicator = ({ type, value, className }: UrgencyIndicatorProps) => {
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    if (type === 'price_drop') {
      const timer = setInterval(() => {
        const endTime = new Date()
        endTime.setHours(endTime.getHours() + 2) // 2 hours from now
        
        const now = new Date()
        const diff = endTime.getTime() - now.getTime()
        
        if (diff > 0) {
          const hours = Math.floor(diff / (1000 * 60 * 60))
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
          setTimeLeft(`${hours}h ${minutes}m`)
        }
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [type])

  const indicators = {
    rooms_left: {
      icon: Users,
      text: `Only ${value || 3} rooms left!`,
      variant: 'destructive' as const,
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600'
    },
    high_demand: {
      icon: TrendingUp,
      text: 'High demand - booking fast',
      variant: 'secondary' as const,
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600'
    },
    recently_booked: {
      icon: Clock,
      text: `${value || 7} people booked today`,
      variant: 'default' as const,
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600'
    },
    price_drop: {
      icon: Zap,
      text: `Special rate ends in ${timeLeft}`,
      variant: 'default' as const,
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600'
    }
  }

  const indicator = indicators[type]
  const Icon = indicator.icon

  return (
    <Badge variant={indicator.variant} className={className}>
      <Icon className="h-3 w-3 mr-1" />
      {indicator.text}
    </Badge>
  )
}

interface BookingPressureCardProps {
  hotelId: string
  className?: string
}

export const BookingPressureCard = ({ hotelId, className }: BookingPressureCardProps) => {
  // Mock data - in real app this would come from analytics
  const pressureData = {
    viewsLast24h: Math.floor(Math.random() * 100) + 50,
    bookingsLast24h: Math.floor(Math.random() * 15) + 5,
    availableRooms: Math.floor(Math.random() * 10) + 2
  }

  return (
    <Card className={`border-l-4 border-l-orange-500 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="text-sm font-medium text-orange-700">Booking Activity</h4>
            <div className="mt-2 space-y-1 text-xs text-muted-foreground">
              <p>{pressureData.viewsLast24h} people viewed this hotel today</p>
              <p>{pressureData.bookingsLast24h} bookings in the last 24 hours</p>
            </div>
          </div>
          <TrendingUp className="h-4 w-4 text-orange-600" />
        </div>
        
        {pressureData.availableRooms <= 5 && (
          <div className="mt-3 pt-3 border-t">
            <UrgencyIndicator 
              type="rooms_left" 
              value={pressureData.availableRooms}
              className="text-xs"
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}