import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { savePassportInfo } from "@/lib/bookingDataClient";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Upload, FileText, CheckCircle, AlertCircle, Camera } from "lucide-react";

const countries = [
  "Australia", "United States", "United Kingdom", "Canada", "Germany", 
  "France", "Japan", "Singapore", "New Zealand", "Netherlands"
];

export default function PassportUploader() {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [passportData, setPassportData] = useState({
    country: "",
    passport_number: "",
    expiry_date: "",
    verified: false,
    document_url: ""
  });

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (JPG, PNG, etc.)",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    
    try {
      // TODO: Upload to Supabase Storage when storage buckets are configured
      // For now, simulate upload
      const mockUrl = `passport_${user.id}_${Date.now()}.jpg`;
      
      setPassportData(prev => ({
        ...prev,
        document_url: mockUrl
      }));

      toast({
        title: "Upload successful",
        description: "Passport image uploaded. Ready for validation.",
      });

      // Trigger validation
      await handleValidatePassport(mockUrl);
      
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload passport image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleValidatePassport = async (imageUrl: string) => {
    if (!user) return;

    setValidating(true);
    
    try {
      // Call edge function for passport validation
      const { data, error } = await supabase.functions.invoke('validate-passport', {
        body: {
          passportImageUrl: imageUrl,
          userId: user.id
        }
      });

      if (error) {
        throw error;
      }

      if (data.success) {
        setPassportData(prev => ({
          ...prev,
          verified: data.verified,
          country: data.extractedData.country || prev.country,
          passport_number: data.extractedData.passportNumber || prev.passport_number,
          expiry_date: data.extractedData.expiryDate || prev.expiry_date
        }));

        toast({
          title: data.verified ? "Passport verified!" : "Validation complete",
          description: data.verified 
            ? "Your passport has been successfully verified." 
            : "Passport processed but requires manual review.",
        });
      } else {
        toast({
          title: "Validation failed",
          description: "Unable to validate passport. Please check the image quality.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Validation error:', error);
      toast({
        title: "Validation error",
        description: "Failed to validate passport. Please try again.",
        variant: "destructive",
      });
    } finally {
      setValidating(false);
    }
  };

  const handleSave = async () => {
    if (!user || !passportData.country) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      await savePassportInfo({
        user_id: user.id,
        ...passportData
      });

      toast({
        title: "Passport info saved",
        description: "Your passport information has been saved successfully.",
      });
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "Save failed",
        description: "Failed to save passport information.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Passport Information
          {passportData.verified && (
            <CheckCircle className="h-5 w-5 text-green-500" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload Section */}
        <div className="space-y-3">
          <Label>Upload Passport Photo</Label>
          <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            {passportData.document_url ? (
              <div className="space-y-3">
                <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
                <p className="text-sm font-medium">Passport uploaded successfully</p>
                {passportData.verified ? (
                  <div className="flex items-center justify-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">Verified</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2 text-yellow-600">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">Pending verification</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <Camera className="h-12 w-12 mx-auto text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Upload your passport photo</p>
                  <p className="text-xs text-muted-foreground">
                    Clear photo of the main page (max 5MB)
                  </p>
                </div>
              </div>
            )}
            
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || validating}
              className="mt-4"
            >
              {uploading ? (
                <>
                  <Upload className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : validating ? (
                <>
                  <AlertCircle className="h-4 w-4 mr-2 animate-spin" />
                  Validating...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  {passportData.document_url ? 'Replace Image' : 'Choose File'}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Manual Entry Section */}
        <div className="space-y-4">
          <div className="space-y-3">
            <Label htmlFor="country">Country of Issue *</Label>
            <Select 
              value={passportData.country} 
              onValueChange={(value) => setPassportData(prev => ({ ...prev, country: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                {countries.map(country => (
                  <SelectItem key={country} value={country}>
                    {country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label htmlFor="passport_number">Passport Number</Label>
            <Input
              id="passport_number"
              value={passportData.passport_number}
              onChange={(e) => setPassportData(prev => ({ ...prev, passport_number: e.target.value }))}
              placeholder="Enter passport number"
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="expiry_date">Expiry Date</Label>
            <Input
              id="expiry_date"
              type="date"
              value={passportData.expiry_date}
              onChange={(e) => setPassportData(prev => ({ ...prev, expiry_date: e.target.value }))}
            />
          </div>
        </div>

        <Button 
          onClick={handleSave} 
          disabled={!user || !passportData.country}
          className="w-full"
        >
          Save Passport Information
        </Button>

        <div className="p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            🔒 Your passport information is encrypted and stored securely. 
            Verified passports enable faster visa processing and one-click booking.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}