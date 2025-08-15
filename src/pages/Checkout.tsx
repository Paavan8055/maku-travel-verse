
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const CheckoutPage = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Legacy route - redirect to home since we now use direct paths
    console.log('Legacy checkout route accessed - redirecting to home');
    navigate('/', { replace: true });
  }, [navigate]);

  // This component now acts as a router - the actual content is handled by useEffect

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
};

export default CheckoutPage;
