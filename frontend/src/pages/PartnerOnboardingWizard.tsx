/**
 * Professional Partner Onboarding Wizard
 * Multi-stage onboarding for hotels, airlines, activity providers
 * Supports KYC, document upload, integration setup, payment config
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building, FileText, Shield, Puzzle, CreditCard, Check,
  Upload, AlertCircle, ArrowRight, ArrowLeft, Sparkles
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const PartnerOnboardingWizard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;

  const [formData, setFormData] = useState({
    // Step 1: Business Info
    partner_type: 'hotel',
    business_name: '',
    legal_entity_name: '',
    tax_id: '',
    primary_contact_name: '',
    primary_contact_email: '',
    primary_contact_phone: '',
    address: '',
    country: '',
    
    // Step 2: Property/Service Details
    properties_count: 1,
    total_rooms: 0,
    star_rating: 3,
    property_types: [] as string[],
    destinations_served: [] as string[],
    
    // Step 3: Integration
    integration_type: 'api',
    channel_manager: '',
    api_endpoint: '',
    inventory_sync_method: 'real_time',
    
    // Step 4: KYC/Verification
    business_license_file: null as File | null,
    tax_certificate_file: null as File | null,
    id_proof_file: null as File | null,
    
    // Step 5: Payment
    commission_model: 'percentage',
    commission_rate: 15,
    currency_preference: 'USD',
    payment_terms: 'net_30',
    bank_name: '',
    account_number: '',
    routing_number: ''
  });

  const steps = [
    { number: 1, title: 'Business Information', icon: Building, description: 'Company details & contact' },
    { number: 2, title: 'Property Details', icon: FileText, description: 'Service offerings & inventory' },
    { number: 3, title: 'Integration Setup', icon: Puzzle, description: 'API & channel manager' },
    { number: 4, title: 'Verification', icon: Shield, description: 'KYC & document upload' },
    { number: 5, title: 'Payment Setup', icon: CreditCard, description: 'Commission & banking' }
  ];

  const handleFileUpload = async (file: File, type: string) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${type}_${Date.now()}.${fileExt}`;
      const filePath = `partner-documents/${fileName}`;

      const { error } = await supabase.storage
        .from('partner-docs')
        .upload(filePath, file);

      if (error) throw error;

      toast({
        title: 'Document Uploaded',
        description: `${type} uploaded successfully`
      });

      return filePath;
    } catch (error) {
      toast({
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
      return null;
    }
  };

  const handleSubmit = async () => {
    try {
      // Insert partner into registry
      const { data: partnerData, error: partnerError } = await supabase
        .from('partner_registry')
        .insert([{
          ...formData,
          onboarding_status: 'completed',
          onboarding_step: 5,
          is_active: false, // Requires admin approval
          kyc_status: 'pending'
        }])
        .select()
        .single();

      if (partnerError) throw partnerError;

      // Upload documents if any
      const documentPromises = [];
      if (formData.business_license_file) {
        documentPromises.push(handleFileUpload(formData.business_license_file, 'business_license'));
      }
      if (formData.tax_certificate_file) {
        documentPromises.push(handleFileUpload(formData.tax_certificate_file, 'tax_certificate'));
      }
      if (formData.id_proof_file) {
        documentPromises.push(handleFileUpload(formData.id_proof_file, 'id_proof'));
      }

      await Promise.all(documentPromises);

      toast({
        title: 'Onboarding Complete! 🎉',
        description: 'Your application is under review. We\'ll contact you within 2 business days.'
      });

      navigate('/partner-portal');
    } catch (error) {
      toast({
        title: 'Submission Failed',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive'
      });
    }
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-12 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-purple-100 text-purple-700">
            <Sparkles className="w-3 h-3 mr-1" />
            Partner Onboarding
          </Badge>
          <h1 className="text-4xl font-bold mb-3">Join Maku.Travel Marketplace</h1>
          <p className="text-lg text-slate-600">
            Connect with motivated travelers. Fill your occupancy. Earn more.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-12">
          <Progress value={(currentStep / totalSteps) * 100} className="h-2 mb-6" />
          <div className="flex justify-between">
            {steps.map((step) => {
              const StepIcon = step.icon;
              const isActive = currentStep === step.number;
              const isCompleted = currentStep > step.number;
              
              return (
                <div key={step.number} className="flex-1 text-center">
                  <div className={`
                    w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center
                    ${isCompleted ? 'bg-green-600' : isActive ? 'bg-purple-600' : 'bg-slate-200'}
                  `}>
                    {isCompleted ? (
                      <Check className="w-6 h-6 text-white" />
                    ) : (
                      <StepIcon className={`w-6 h-6 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    )}
                  </div>
                  <p className={`text-sm font-semibold ${isActive ? 'text-purple-600' : 'text-slate-600'}`}>
                    {step.title}
                  </p>
                  <p className="text-xs text-slate-500">{step.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Content */}
        <Card className="p-8">
          {/* Step 1: Business Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Business Information</h2>
                <p className="text-slate-600 mb-6">Tell us about your travel business</p>
              </div>

              <div>
                <label className="text-sm font-semibold mb-2 block">Partner Type *</label>
                <div className="grid grid-cols-3 gap-3">
                  {['hotel', 'airline', 'activity_provider'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setFormData({...formData, partner_type: type})}
                      className={`p-4 rounded-lg border-2 capitalize transition-all ${
                        formData.partner_type === type
                          ? 'border-purple-600 bg-purple-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {type.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold mb-2 block">Business Name *</label>
                  <Input
                    placeholder="e.g., Paradise Resort & Spa"
                    value={formData.business_name}
                    onChange={(e) => setFormData({...formData, business_name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold mb-2 block">Legal Entity Name *</label>
                  <Input
                    placeholder="e.g., Paradise Hotels Pvt Ltd"
                    value={formData.legal_entity_name}
                    onChange={(e) => setFormData({...formData, legal_entity_name: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold mb-2 block">Tax ID / VAT Number *</label>
                  <Input
                    placeholder="e.g., 123456789"
                    value={formData.tax_id}
                    onChange={(e) => setFormData({...formData, tax_id: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold mb-2 block">Country *</label>
                  <Input
                    placeholder="e.g., India"
                    value={formData.country}
                    onChange={(e) => setFormData({...formData, country: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold mb-2 block">Primary Contact Name *</label>
                <Input
                  placeholder="e.g., John Smith"
                  value={formData.primary_contact_name}
                  onChange={(e) => setFormData({...formData, primary_contact_name: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold mb-2 block">Contact Email *</label>
                  <Input
                    type="email"
                    placeholder="john@paradise-resort.com"
                    value={formData.primary_contact_email}
                    onChange={(e) => setFormData({...formData, primary_contact_email: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold mb-2 block">Contact Phone *</label>
                  <Input
                    type="tel"
                    placeholder="+1 234 567 8900"
                    value={formData.primary_contact_phone}
                    onChange={(e) => setFormData({...formData, primary_contact_phone: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold mb-2 block">Business Address *</label>
                <Input
                  placeholder="Full business address"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                />
              </div>
            </div>
          )}

          {/* Step 2: Property Details */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Property & Service Details</h2>
                <p className="text-slate-600 mb-6">Tell us about your offerings</p>
              </div>

              {formData.partner_type === 'hotel' && (
                <>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-semibold mb-2 block">Number of Properties</label>
                      <Input
                        type="number"
                        value={formData.properties_count}
                        onChange={(e) => setFormData({...formData, properties_count: parseInt(e.target.value)})}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold mb-2 block">Total Rooms</label>
                      <Input
                        type="number"
                        value={formData.total_rooms}
                        onChange={(e) => setFormData({...formData, total_rooms: parseInt(e.target.value)})}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold mb-2 block">Star Rating</label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <button
                            key={rating}
                            onClick={() => setFormData({...formData, star_rating: rating})}
                            className={`w-10 h-10 rounded-full border-2 ${
                              formData.star_rating === rating
                                ? 'border-purple-600 bg-purple-600 text-white'
                                : 'border-slate-200'
                            }`}
                          >
                            {rating}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-semibold mb-2 block">Property Types</label>
                    <div className="flex flex-wrap gap-2">
                      {['Hotel', 'Resort', 'Apartment', 'Villa', 'Hostel', 'B&B'].map((type) => (
                        <label key={type} className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-slate-50">
                          <input
                            type="checkbox"
                            checked={formData.property_types.includes(type)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({...formData, property_types: [...formData.property_types, type]});
                              } else {
                                setFormData({...formData, property_types: formData.property_types.filter(t => t !== type)});
                              }
                            }}
                          />
                          <span className="text-sm">{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="text-sm font-semibold mb-2 block">Primary Destinations Served</label>
                <Input
                  placeholder="e.g., Maldives, Bali, Thailand (comma separated)"
                  onChange={(e) => setFormData({
                    ...formData,
                    destinations_served: e.target.value.split(',').map(d => d.trim())
                  })}
                />
              </div>
            </div>
          )}

          {/* Step 3: Integration Setup */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Integration Setup</h2>
                <p className="text-slate-600 mb-6">How will you connect your inventory?</p>
              </div>

              <div>
                <label className="text-sm font-semibold mb-3 block">Integration Type</label>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { value: 'api', label: 'API Integration', desc: 'Direct API connection' },
                    { value: 'channel_manager', label: 'Channel Manager', desc: 'Via existing CM' },
                    { value: 'manual', label: 'Manual Upload', desc: 'Excel/CSV upload' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setFormData({...formData, integration_type: option.value})}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        formData.integration_type === option.value
                          ? 'border-purple-600 bg-purple-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <p className="font-semibold mb-1">{option.label}</p>
                      <p className="text-xs text-slate-600">{option.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {formData.integration_type === 'api' && (
                <div>
                  <label className="text-sm font-semibold mb-2 block">API Endpoint URL</label>
                  <Input
                    placeholder="https://api.yourhotel.com/v1"
                    value={formData.api_endpoint}
                    onChange={(e) => setFormData({...formData, api_endpoint: e.target.value})}
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    💡 We support REST APIs, SOAP, and XML formats
                  </p>
                </div>
              )}

              {formData.integration_type === 'channel_manager' && (
                <div>
                  <label className="text-sm font-semibold mb-2 block">Channel Manager</label>
                  <select
                    className="w-full p-3 border rounded-lg"
                    value={formData.channel_manager}
                    onChange={(e) => setFormData({...formData, channel_manager: e.target.value})}
                  >
                    <option value="">Select...</option>
                    <option value="cloudbeds">Cloudbeds</option>
                    <option value="opera">Opera PMS</option>
                    <option value="mews">Mews</option>
                    <option value="guesty">Guesty</option>
                    <option value="hotelogix">Hotelogix</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              )}

              <div>
                <label className="text-sm font-semibold mb-2 block">Inventory Sync Method</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'real_time', label: 'Real-Time', icon: '⚡' },
                    { value: 'daily', label: 'Daily Sync', icon: '📅' },
                    { value: 'manual', label: 'Manual', icon: '✋' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setFormData({...formData, inventory_sync_method: option.value})}
                      className={`p-3 rounded-lg border-2 ${
                        formData.inventory_sync_method === option.value
                          ? 'border-purple-600 bg-purple-50'
                          : 'border-slate-200'
                      }`}
                    >
                      <span className="text-2xl mb-1 block">{option.icon}</span>
                      <span className="text-sm font-semibold">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: KYC & Verification */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Verification & Compliance</h2>
                <p className="text-slate-600 mb-6">Upload required documents for KYC verification</p>
              </div>

              <div className="space-y-4">
                {[
                  { key: 'business_license_file', label: 'Business License', required: true },
                  { key: 'tax_certificate_file', label: 'Tax Registration Certificate', required: true },
                  { key: 'id_proof_file', label: 'ID Proof of Authorized Signatory', required: true }
                ].map((doc) => (
                  <div key={doc.key} className="p-4 border-2 border-dashed rounded-lg hover:border-purple-400 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-semibold">
                        {doc.label} {doc.required && <span className="text-red-500">*</span>}
                      </label>
                      {formData[doc.key as keyof typeof formData] && (
                        <Badge className="bg-green-600 text-white">
                          <Check className="w-3 h-3 mr-1" />
                          Uploaded
                        </Badge>
                      )}
                    </div>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          setFormData({...formData, [doc.key]: e.target.files[0]});
                        }
                      }}
                      className="w-full text-sm"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Accepted: PDF, JPG, PNG (max 5MB)
                    </p>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-blue-900 mb-1">Secure Document Handling</p>
                    <p className="text-sm text-blue-700">
                      All documents are encrypted and stored securely in Supabase Storage. 
                      Only authorized Maku.Travel compliance team can access these files.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Payment Setup */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Payment & Commission Setup</h2>
                <p className="text-slate-600 mb-6">Configure your financial preferences</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold mb-2 block">Commission Model</label>
                  <select
                    className="w-full p-3 border rounded-lg"
                    value={formData.commission_model}
                    onChange={(e) => setFormData({...formData, commission_model: e.target.value})}
                  >
                    <option value="percentage">Percentage-based</option>
                    <option value="fixed">Fixed per booking</option>
                    <option value="hybrid">Hybrid model</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold mb-2 block">Commission Rate (%)</label>
                  <Input
                    type="number"
                    step="0.5"
                    value={formData.commission_rate}
                    onChange={(e) => setFormData({...formData, commission_rate: parseFloat(e.target.value)})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold mb-2 block">Preferred Currency</label>
                  <select
                    className="w-full p-3 border rounded-lg"
                    value={formData.currency_preference}
                    onChange={(e) => setFormData({...formData, currency_preference: e.target.value})}
                  >
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="INR">INR - Indian Rupee</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold mb-2 block">Payment Terms</label>
                  <select
                    className="w-full p-3 border rounded-lg"
                    value={formData.payment_terms}
                    onChange={(e) => setFormData({...formData, payment_terms: e.target.value})}
                  >
                    <option value="net_15">Net 15 days</option>
                    <option value="net_30">Net 30 days</option>
                    <option value="net_60">Net 60 days</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold mb-2 block">Bank Name</label>
                <Input
                  placeholder="e.g., HDFC Bank"
                  value={formData.bank_name}
                  onChange={(e) => setFormData({...formData, bank_name: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold mb-2 block">Account Number</label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={formData.account_number}
                    onChange={(e) => setFormData({...formData, account_number: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold mb-2 block">Routing/SWIFT Code</label>
                  <Input
                    placeholder="e.g., HDFCINBBXXX"
                    value={formData.routing_number}
                    onChange={(e) => setFormData({...formData, routing_number: e.target.value})}
                  />
                </div>
              </div>

              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-800">
                  🔒 Banking information is encrypted and stored in Supabase Vault. 
                  No human has direct access to your sensitive financial data.
                </p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            <p className="text-sm text-slate-600">
              Step {currentStep} of {totalSteps}
            </p>

            {currentStep < totalSteps ? (
              <Button onClick={nextStep}>
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                className="bg-gradient-to-r from-purple-600 to-rose-600"
                onClick={handleSubmit}
              >
                <Check className="w-4 h-4 mr-2" />
                Submit Application
              </Button>
            )}
          </div>
        </Card>

        {/* Help Section */}
        <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-semibold mb-2">Need Help?</h3>
          <p className="text-sm text-slate-700 mb-3">
            Our partner success team is here to assist you throughout the onboarding process.
          </p>
          <div className="flex gap-4 text-sm">
            <a href="mailto:partners@maku.travel" className="text-purple-600 hover:underline">
              Email: partners@maku.travel
            </a>
            <a href="https://docs.maku.travel" className="text-purple-600 hover:underline">
              Documentation →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartnerOnboardingWizard;
