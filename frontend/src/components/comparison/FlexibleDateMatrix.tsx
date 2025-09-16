import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { format, addDays, subDays, isSameDay, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

interface FlexibleDateMatrixProps {
  baseCriteria: {
    origin: string;
    destination: string;
    departureDate: string;
    returnDate?: string;
    passengers: number;
  };
  onDateSelect: (departureDate: string, returnDate?: string) => void;
  onPriceSearch: (criteria: any) => Promise<{ flights: any[]; averagePrice: number; }>;
}

interface DateOption {
  date: string;
  displayDate: string;
  dayOfWeek: string;
  price?: number;
  priceChange?: number;
  savings?: number;
  loading: boolean;
  flights: any[];
}

export const FlexibleDateMatrix: React.FC<FlexibleDateMatrixProps> = ({
  baseCriteria,
  onDateSelect,
  onPriceSearch
}) => {
  const [dateMatrix, setDateMatrix] = useState<DateOption[][]>([]);
  const [basePrice, setBasePrice] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<{ departure: string; return?: string } | null>(null);
  const [matrixType, setMatrixType] = useState<'departure' | 'both'>('departure');
  const [isLoading, setIsLoading] = useState(false);

  const baseDate = parseISO(baseCriteria.departureDate);
  const daysRange = 7; // Show ±7 days

  useEffect(() => {
    generateDateMatrix();
  }, [baseCriteria]);

  const generateDateMatrix = async () => {
    setIsLoading(true);
    const matrix: DateOption[][] = [];
    
    if (matrixType === 'departure') {
      // Single row for departure dates only
      const row: DateOption[] = [];
      for (let i = -daysRange; i <= daysRange; i++) {
        const date = addDays(baseDate, i);
        const dateStr = format(date, 'yyyy-MM-dd');
        const isBaseDate = isSameDay(date, baseDate);
        
        row.push({
          date: dateStr,
          displayDate: format(date, 'MMM dd'),
          dayOfWeek: format(date, 'EEE'),
          loading: !isBaseDate,
          flights: [],
          price: isBaseDate ? basePrice || undefined : undefined
        });
      }
      matrix.push(row);
    } else if (matrixType === 'both' && baseCriteria.returnDate) {
      // Grid for departure vs return dates
      const returnBaseDate = parseISO(baseCriteria.returnDate);
      
      for (let depOffset = -3; depOffset <= 3; depOffset++) {
        const row: DateOption[] = [];
        const depDate = addDays(baseDate, depOffset);
        
        for (let retOffset = -3; retOffset <= 3; retOffset++) {
          const retDate = addDays(returnBaseDate, retOffset);
          const depDateStr = format(depDate, 'yyyy-MM-dd');
          const retDateStr = format(retDate, 'yyyy-MM-dd');
          
          const isBaseCombo = depOffset === 0 && retOffset === 0;
          
          row.push({
            date: `${depDateStr}|${retDateStr}`,
            displayDate: `${format(depDate, 'dd')}/${format(retDate, 'dd')}`,
            dayOfWeek: format(depDate, 'EEE'),
            loading: !isBaseCombo,
            flights: [],
            price: isBaseCombo ? basePrice || undefined : undefined
          });
        }
        matrix.push(row);
      }
    }
    
    setDateMatrix(matrix);
    
    // Search for prices for each date combination
    await searchAllDatePrices(matrix);
    setIsLoading(false);
  };

  const searchAllDatePrices = async (matrix: DateOption[][]) => {
    const searchPromises: Promise<void>[] = [];
    
    for (let rowIndex = 0; rowIndex < matrix.length; rowIndex++) {
      for (let colIndex = 0; colIndex < matrix[rowIndex].length; colIndex++) {
        const dateOption = matrix[rowIndex][colIndex];
        
        if (dateOption.loading) {
          const promise = searchDatePrice(dateOption, rowIndex, colIndex);
          searchPromises.push(promise);
        }
      }
    }
    
    // Execute searches in batches to avoid overwhelming the API
    const batchSize = 5;
    for (let i = 0; i < searchPromises.length; i += batchSize) {
      const batch = searchPromises.slice(i, i + batchSize);
      await Promise.all(batch);
      
      // Add a small delay between batches
      if (i + batchSize < searchPromises.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  };

  const searchDatePrice = async (dateOption: DateOption, rowIndex: number, colIndex: number) => {
    try {
      let searchCriteria;
      
      if (matrixType === 'departure') {
        searchCriteria = {
          ...baseCriteria,
          departureDate: dateOption.date
        };
      } else {
        const [depDate, retDate] = dateOption.date.split('|');
        searchCriteria = {
          ...baseCriteria,
          departureDate: depDate,
          returnDate: retDate
        };
      }
      
      const result = await onPriceSearch(searchCriteria);
      
      // Update the matrix with the result
      setDateMatrix(prev => {
        const newMatrix = [...prev];
        const updatedOption = {
          ...newMatrix[rowIndex][colIndex],
          loading: false,
          price: result.averagePrice,
          flights: result.flights,
          priceChange: basePrice ? result.averagePrice - basePrice : 0,
          savings: basePrice && result.averagePrice < basePrice ? basePrice - result.averagePrice : 0
        };
        newMatrix[rowIndex][colIndex] = updatedOption;
        return newMatrix;
      });
      
      // Set base price if not set
      if (!basePrice && dateOption.date === baseCriteria.departureDate) {
        setBasePrice(result.averagePrice);
      }
      
    } catch (error) {
      console.error('Error searching date price:', error);
      setDateMatrix(prev => {
        const newMatrix = [...prev];
        newMatrix[rowIndex][colIndex] = {
          ...newMatrix[rowIndex][colIndex],
          loading: false,
          price: undefined
        };
        return newMatrix;
      });
    }
  };

  const handleDateSelect = (dateOption: DateOption) => {
    if (matrixType === 'departure') {
      setSelectedDate({ departure: dateOption.date });
      onDateSelect(dateOption.date, baseCriteria.returnDate);
    } else {
      const [depDate, retDate] = dateOption.date.split('|');
      setSelectedDate({ departure: depDate, return: retDate });
      onDateSelect(depDate, retDate);
    }
  };

  const formatPrice = (price?: number) => {
    if (!price) return '—';
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0
    }).format(price);
  };

  const getPriceChangeIcon = (priceChange?: number) => {
    if (!priceChange || Math.abs(priceChange) < 10) return <Minus className="h-3 w-3" />;
    return priceChange > 0 ? <TrendingUp className="h-3 w-3 text-red-500" /> : <TrendingDown className="h-3 w-3 text-green-500" />;
  };

  const getPriceChangeColor = (priceChange?: number, savings?: number) => {
    if (savings && savings > 0) return 'text-green-600 bg-green-50 border-green-200';
    if (!priceChange || Math.abs(priceChange) < 10) return 'text-muted-foreground bg-muted/30';
    return priceChange > 0 ? 'text-red-600 bg-red-50 border-red-200' : 'text-green-600 bg-green-50 border-green-200';
  };

  const isSelectedDate = (dateOption: DateOption) => {
    if (!selectedDate) return false;
    
    if (matrixType === 'departure') {
      return dateOption.date === selectedDate.departure;
    } else {
      const [depDate, retDate] = dateOption.date.split('|');
      return depDate === selectedDate.departure && retDate === selectedDate.return;
    }
  };

  const getBestPrice = () => {
    const allPrices = dateMatrix.flat().map(d => d.price).filter(Boolean) as number[];
    return allPrices.length > 0 ? Math.min(...allPrices) : null;
  };

  const getWorstPrice = () => {
    const allPrices = dateMatrix.flat().map(d => d.price).filter(Boolean) as number[];
    return allPrices.length > 0 ? Math.max(...allPrices) : null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Flexible Date Pricing
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant={matrixType === 'departure' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMatrixType('departure')}
              >
                Departure Only
              </Button>
              {baseCriteria.returnDate && (
                <Button
                  variant={matrixType === 'both' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMatrixType('both')}
                >
                  Round Trip
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Price Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {formatPrice(getBestPrice())}
            </div>
            <div className="text-sm text-muted-foreground">Best Price</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">
              {formatPrice(basePrice)}
            </div>
            <div className="text-sm text-muted-foreground">Your Dates</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">
              {formatPrice(getWorstPrice())}
            </div>
            <div className="text-sm text-muted-foreground">Highest Price</div>
          </CardContent>
        </Card>
      </div>

      {/* Date Matrix */}
      <Card>
        <CardContent className="p-6">
          {isLoading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
              <p className="text-muted-foreground">Searching flexible dates...</p>
            </div>
          )}
          
          {!isLoading && (
            <div className="space-y-4">
              {matrixType === 'departure' && (
                <>
                  <div className="text-sm text-muted-foreground mb-4">
                    Select a departure date to see price differences
                  </div>
                  <div className="grid grid-cols-7 lg:grid-cols-15 gap-2">
                    {dateMatrix[0]?.map((dateOption, index) => (
                      <button
                        key={index}
                        onClick={() => handleDateSelect(dateOption)}
                        className={cn(
                          "p-3 rounded-lg border text-center hover:border-primary transition-colors",
                          isSelectedDate(dateOption) && "border-primary bg-primary/10",
                          getPriceChangeColor(dateOption.priceChange, dateOption.savings)
                        )}
                      >
                        <div className="text-xs font-medium">{dateOption.dayOfWeek}</div>
                        <div className="text-sm font-semibold">{dateOption.displayDate}</div>
                        {dateOption.loading ? (
                          <div className="h-4 w-4 animate-spin border border-primary border-t-transparent rounded-full mx-auto mt-1" />
                        ) : (
                          <>
                            <div className="text-sm font-bold">{formatPrice(dateOption.price)}</div>
                            {dateOption.savings && dateOption.savings > 0 && (
                              <Badge variant="destructive" className="text-xs mt-1">
                                Save ${dateOption.savings}
                              </Badge>
                            )}
                            {dateOption.priceChange && (
                              <div className="flex items-center justify-center mt-1">
                                {getPriceChangeIcon(dateOption.priceChange)}
                              </div>
                            )}
                          </>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {matrixType === 'both' && (
                <>
                  <div className="text-sm text-muted-foreground mb-4">
                    Departure dates vs Return dates - Click to select combination
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          <th className="p-2 text-left text-xs text-muted-foreground">Dep \ Ret</th>
                          {dateMatrix[0]?.slice(0, 7).map((_, colIndex) => (
                            <th key={colIndex} className="p-2 text-center text-xs text-muted-foreground">
                              +{colIndex - 3}d
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {dateMatrix.map((row, rowIndex) => (
                          <tr key={rowIndex}>
                            <td className="p-2 text-xs text-muted-foreground">
                              +{rowIndex - 3}d
                            </td>
                            {row.slice(0, 7).map((dateOption, colIndex) => (
                              <td key={colIndex} className="p-1">
                                <button
                                  onClick={() => handleDateSelect(dateOption)}
                                  className={cn(
                                    "w-full p-2 rounded border text-center hover:border-primary transition-colors",
                                    isSelectedDate(dateOption) && "border-primary bg-primary/10",
                                    getPriceChangeColor(dateOption.priceChange, dateOption.savings)
                                  )}
                                >
                                  {dateOption.loading ? (
                                    <div className="h-3 w-3 animate-spin border border-primary border-t-transparent rounded-full mx-auto" />
                                  ) : (
                                    <div className="text-xs font-bold">
                                      {formatPrice(dateOption.price)}
                                    </div>
                                  )}
                                </button>
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 justify-center text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border bg-green-50 border-green-200"></div>
              <span>Cheaper</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border bg-muted/30"></div>
              <span>Similar Price</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border bg-red-50 border-red-200"></div>
              <span>More Expensive</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border border-primary bg-primary/10"></div>
              <span>Selected</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};