import React from 'react';
import { useSearchParams } from 'react-router-dom';

const CarSearchPage = () => {
  const [searchParams] = useSearchParams();
  
  const location = searchParams.get('location') || '';
  const pickupDate = searchParams.get('pickupDate') || '';
  const returnDate = searchParams.get('returnDate') || '';

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Car Rental Search Results</h1>
        <p className="text-muted-foreground mb-4">
          Location: {location} | Pickup: {pickupDate} | Return: {returnDate}
        </p>
        
        <div className="text-center py-8">
          <p className="text-muted-foreground">Car rental search functionality is in development.</p>
        </div>
      </div>
    </div>
  );
};

export default CarSearchPage;