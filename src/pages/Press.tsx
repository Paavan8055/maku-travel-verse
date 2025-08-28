import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Newspaper, Download, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const Press = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 pt-24">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-center flex items-center justify-center">
            <Newspaper className="h-8 w-8 mr-3" />
            Press & Media
          </h1>
          
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Media Kit</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Download our media kit for high-resolution logos, company information, and brand guidelines.
              </p>
              <Button className="mr-4">
                <Download className="h-4 w-4 mr-2" />
                Download Media Kit
              </Button>
              <Button variant="outline">
                <Mail className="h-4 w-4 mr-2" />
                Contact Press Team
              </Button>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Recent News</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-l-4 border-primary pl-4">
                  <h3 className="font-semibold">Maku.Travel Expands Global Reach</h3>
                  <p className="text-sm text-muted-foreground">January 2025 - New partnerships with leading travel providers worldwide.</p>
                </div>
                <div className="border-l-4 border-primary pl-4">
                  <h3 className="font-semibold">Innovation in Travel Technology</h3>
                  <p className="text-sm text-muted-foreground">December 2024 - Latest platform updates enhance user experience.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Press Contact</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                For media inquiries, interviews, and press releases, please contact our press team at:
              </p>
              <p className="font-semibold mt-2">press@maku.travel</p>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Press;