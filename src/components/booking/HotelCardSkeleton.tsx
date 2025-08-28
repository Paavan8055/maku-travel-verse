import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

export const HotelCardSkeleton = () => {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex flex-col lg:flex-row">
          {/* Image skeleton */}
          <div className="w-full lg:w-1/3">
            <Skeleton className="h-48 lg:h-56 w-full" />
          </div>
          
          {/* Content skeleton */}
          <div className="flex-1 p-4 lg:p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </div>
              <div className="text-right ml-4">
                <Skeleton className="h-4 w-16 mb-1" />
                <Skeleton className="h-6 w-20" />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-4">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-14" />
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-8" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}