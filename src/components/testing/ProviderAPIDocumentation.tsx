/**
 * Provider API Documentation & Testing Interface
 * 
 * Interactive documentation for all provider APIs with live testing capabilities,
 * parameter validation, and response schema documentation.
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, XCircle, Code, TestTube, Book, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ParameterMapper from '@/services/core/ParameterMapper';

interface APIEndpoint {
  name: string;
  provider: 'amadeus' | 'hotelbeds' | 'sabre';
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  description: string;
  parameters: APIParameter[];
  responseSchema: any;
  examples: APIExample[];
  rateLimit: string;
  authentication: string;
}

interface APIParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array';
  required: boolean;
  description: string;
  format?: string;
  example?: any;
  validation?: string;
}

interface APIExample {
  name: string;
  description: string;
  request: any;
  response: any;
}

interface TestResult {
  endpoint: string;
  success: boolean;
  responseTime: number;
  statusCode?: number;
  response?: any;
  error?: string;
}

export const ProviderAPIDocumentation = () => {
  const [selectedProvider, setSelectedProvider] = useState<'amadeus' | 'hotelbeds' | 'sabre'>('amadeus');
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('');
  const [testParameters, setTestParameters] = useState<Record<string, any>>({});
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // API Endpoint Definitions
  const apiEndpoints: APIEndpoint[] = [
    // Amadeus Endpoints
    {
      name: 'Flight Offers Search',
      provider: 'amadeus',
      method: 'GET',
      endpoint: '/v2/shopping/flight-offers',
      description: 'Search for flight offers with flexible date ranges and cabin preferences',
      rateLimit: '10 requests/second',
      authentication: 'OAuth 2.0 Bearer Token',
      parameters: [
        { name: 'originLocationCode', type: 'string', required: true, description: '3-letter IATA airport code', format: 'IATA', example: 'SYD' },
        { name: 'destinationLocationCode', type: 'string', required: true, description: '3-letter IATA airport code', format: 'IATA', example: 'MEL' },
        { name: 'departureDate', type: 'date', required: true, description: 'Departure date', format: 'YYYY-MM-DD', example: '2025-09-01' },
        { name: 'returnDate', type: 'date', required: false, description: 'Return date for round-trip', format: 'YYYY-MM-DD', example: '2025-09-05' },
        { name: 'adults', type: 'number', required: true, description: 'Number of adult passengers (1-9)', example: 2, validation: 'min:1,max:9' },
        { name: 'children', type: 'number', required: false, description: 'Number of child passengers (0-8)', example: 0, validation: 'min:0,max:8' },
        { name: 'infants', type: 'number', required: false, description: 'Number of infant passengers (0-8)', example: 0, validation: 'min:0,max:8' },
        { name: 'travelClass', type: 'string', required: false, description: 'Cabin class preference', example: 'ECONOMY' },
        { name: 'currencyCode', type: 'string', required: false, description: 'ISO currency code', format: 'ISO-4217', example: 'AUD' }
      ],
      responseSchema: {
        data: [
          {
            id: 'string',
            source: 'string',
            instantTicketingRequired: 'boolean',
            nonHomogeneous: 'boolean',
            paymentCardRequired: 'boolean',
            lastTicketingDate: 'string',
            itineraries: [
              {
                segments: [
                  {
                    departure: { iataCode: 'string', at: 'string' },
                    arrival: { iataCode: 'string', at: 'string' },
                    carrierCode: 'string',
                    number: 'string',
                    aircraft: { code: 'string' },
                    duration: 'string'
                  }
                ]
              }
            ],
            price: {
              currency: 'string',
              total: 'string',
              base: 'string',
              fees: [{ amount: 'string', type: 'string' }]
            }
          }
        ]
      },
      examples: [
        {
          name: 'Sydney to Melbourne One-Way',
          description: 'Simple domestic flight search',
          request: {
            originLocationCode: 'SYD',
            destinationLocationCode: 'MEL',
            departureDate: '2025-09-01',
            adults: 1,
            travelClass: 'ECONOMY',
            currencyCode: 'AUD'
          },
          response: {
            data: [
              {
                id: '1',
                price: { currency: 'AUD', total: '189.00' },
                itineraries: [{ segments: [{ departure: { iataCode: 'SYD' }, arrival: { iataCode: 'MEL' } }] }]
              }
            ]
          }
        }
      ]
    },
    {
      name: 'Hotel Search',
      provider: 'amadeus',
      method: 'GET',
      endpoint: '/v3/shopping/hotel-offers',
      description: 'Search for hotel offers in a specific city with flexible room configurations',
      rateLimit: '10 requests/second',
      authentication: 'OAuth 2.0 Bearer Token',
      parameters: [
        { name: 'cityCode', type: 'string', required: true, description: '3-letter IATA city code', format: 'IATA', example: 'SYD' },
        { name: 'checkInDate', type: 'date', required: true, description: 'Check-in date', format: 'YYYY-MM-DD', example: '2025-09-01' },
        { name: 'checkOutDate', type: 'date', required: true, description: 'Check-out date', format: 'YYYY-MM-DD', example: '2025-09-03' },
        { name: 'roomQuantity', type: 'number', required: false, description: 'Number of rooms', example: 1, validation: 'min:1,max:9' },
        { name: 'adults', type: 'number', required: false, description: 'Number of adults per room', example: 2, validation: 'min:1,max:9' },
        { name: 'children', type: 'number', required: false, description: 'Number of children per room', example: 0, validation: 'min:0,max:9' },
        { name: 'currency', type: 'string', required: false, description: 'ISO currency code', example: 'AUD' },
        { name: 'lang', type: 'string', required: false, description: 'Language code', example: 'EN' }
      ],
      responseSchema: {
        data: [
          {
            hotel: {
              hotelId: 'string',
              name: 'string',
              rating: 'number',
              contact: { phone: 'string', fax: 'string' },
              address: { lines: ['string'], cityName: 'string', countryCode: 'string' },
              amenities: ['string']
            },
            offers: [
              {
                id: 'string',
                checkInDate: 'string',
                checkOutDate: 'string',
                rateCode: 'string',
                room: { type: 'string', typeEstimated: { category: 'string', beds: 'number' } },
                guests: { adults: 'number', childAges: ['number'] },
                price: { currency: 'string', base: 'string', total: 'string', taxes: [{ code: 'string', amount: 'string' }] },
                policies: { cancellations: [{ type: 'string', amount: 'string' }] }
              }
            ]
          }
        ]
      },
      examples: [
        {
          name: 'Sydney CBD Hotels',
          description: 'Search for hotels in Sydney city center',
          request: {
            cityCode: 'SYD',
            checkInDate: '2025-09-01',
            checkOutDate: '2025-09-03',
            roomQuantity: 1,
            adults: 2,
            currency: 'AUD'
          },
          response: {
            data: [
              {
                hotel: { hotelId: 'SYDHILTO', name: 'Sydney Hilton', rating: 5 },
                offers: [{ id: 'off1', price: { currency: 'AUD', total: '450.00' } }]
              }
            ]
          }
        }
      ]
    },
    // HotelBeds Endpoints
    {
      name: 'Hotel Availability',
      provider: 'hotelbeds',
      method: 'POST',
      endpoint: '/hotel-api/1.0/hotels',
      description: 'Check hotel availability with detailed room and rate information',
      rateLimit: '100 requests/minute',
      authentication: 'API Key + Secret Signature',
      parameters: [
        { name: 'stay', type: 'object', required: true, description: 'Check-in and check-out dates', example: { checkIn: '2025-09-01', checkOut: '2025-09-03' } },
        { name: 'occupancies', type: 'array', required: true, description: 'Room occupancy details', example: [{ rooms: 1, adults: 2, children: 0 }] },
        { name: 'destination', type: 'object', required: true, description: 'Destination information', example: { code: 'SYD' } },
        { name: 'language', type: 'string', required: false, description: 'Response language', example: 'en' },
        { name: 'currency', type: 'string', required: false, description: 'Price currency', example: 'AUD' }
      ],
      responseSchema: {
        hotels: [
          {
            code: 'number',
            name: 'string',
            description: 'string',
            categoryCode: 'string',
            categoryName: 'string',
            destinationCode: 'string',
            countryCode: 'string',
            currency: 'string',
            rooms: [
              {
                code: 'string',
                name: 'string',
                rates: [
                  {
                    rateKey: 'string',
                    rateClass: 'string',
                    rateType: 'string',
                    net: 'string',
                    discount: 'string',
                    sellingRate: 'string',
                    hotelSellingRate: 'string',
                    boardCode: 'string',
                    boardName: 'string',
                    cancellationPolicies: [{ amount: 'string', from: 'string' }]
                  }
                ]
              }
            ]
          }
        ]
      },
      examples: [
        {
          name: 'Sydney Hotel Search',
          description: 'Search for hotels in Sydney with specific occupancy',
          request: {
            stay: { checkIn: '2025-09-01', checkOut: '2025-09-03' },
            occupancies: [{ rooms: 1, adults: 2, children: 0 }],
            destination: { code: 'SYD' },
            language: 'en',
            currency: 'AUD'
          },
          response: {
            hotels: [
              {
                code: 12345,
                name: 'Sydney Harbour Hotel',
                categoryCode: '5EST',
                currency: 'AUD',
                rooms: [{ code: 'DBL', name: 'Double Room', rates: [{ net: '350.00', boardName: 'Room Only' }] }]
              }
            ]
          }
        }
      ]
    }
    // Additional endpoints would be defined here...
  ];

  const filteredEndpoints = apiEndpoints.filter(endpoint => endpoint.provider === selectedProvider);

  const runParameterValidation = (endpoint: APIEndpoint, parameters: Record<string, any>) => {
    const errors: string[] = [];
    
    endpoint.parameters.forEach(param => {
      const value = parameters[param.name];
      
      if (param.required && (value === undefined || value === '')) {
        errors.push(`${param.name} is required`);
      }
      
      if (value !== undefined && value !== '') {
        // Type validation
        switch (param.type) {
          case 'number':
            if (isNaN(Number(value))) {
              errors.push(`${param.name} must be a number`);
            }
            break;
          case 'date':
            if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
              errors.push(`${param.name} must be in YYYY-MM-DD format`);
            }
            break;
          case 'string':
            if (param.format === 'IATA' && !/^[A-Z]{3}$/.test(value)) {
              errors.push(`${param.name} must be a 3-letter IATA code`);
            }
            break;
        }
        
        // Custom validation
        if (param.validation) {
          const rules = param.validation.split(',');
          rules.forEach(rule => {
            const [type, val] = rule.split(':');
            switch (type) {
              case 'min':
                if (Number(value) < Number(val)) {
                  errors.push(`${param.name} must be at least ${val}`);
                }
                break;
              case 'max':
                if (Number(value) > Number(val)) {
                  errors.push(`${param.name} must be at most ${val}`);
                }
                break;
            }
          });
        }
      }
    });
    
    return errors;
  };

  const testEndpoint = async (endpoint: APIEndpoint) => {
    setIsLoading(true);
    const startTime = Date.now();
    
    try {
      // Validate parameters first
      const validationErrors = runParameterValidation(endpoint, testParameters);
      if (validationErrors.length > 0) {
        throw new Error(`Validation errors: ${validationErrors.join(', ')}`);
      }

      // Map parameters using ParameterMapper if applicable
      let mappedParams = testParameters;
      if (endpoint.provider === 'amadeus' && endpoint.name.includes('Hotel')) {
        mappedParams = ParameterMapper.toAmadeusHotels(testParameters);
      } else if (endpoint.provider === 'hotelbeds') {
        mappedParams = ParameterMapper.toHotelBeds(testParameters);
      }

      // Call the appropriate edge function based on provider and endpoint
      const functionName = getFunctionName(endpoint);
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: mappedParams
      });

      const responseTime = Date.now() - startTime;

      if (error) {
        throw new Error(error.message);
      }

      const result: TestResult = {
        endpoint: endpoint.name,
        success: true,
        responseTime,
        statusCode: 200,
        response: data
      };

      setTestResults(prev => [result, ...prev.slice(0, 9)]); // Keep last 10 results
      
      toast({
        title: "Test Successful",
        description: `${endpoint.name} responded in ${responseTime}ms`,
      });

    } catch (error) {
      const responseTime = Date.now() - startTime;
      const result: TestResult = {
        endpoint: endpoint.name,
        success: false,
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };

      setTestResults(prev => [result, ...prev.slice(0, 9)]);
      
      toast({
        title: "Test Failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getFunctionName = (endpoint: APIEndpoint): string => {
    const mapping: Record<string, string> = {
      'amadeus-Flight Offers Search': 'amadeus-flight-search',
      'amadeus-Hotel Search': 'amadeus-hotel-search',
      'hotelbeds-Hotel Availability': 'hotelbeds-search',
      'sabre-Hotel Search': 'sabre-hotel-search'
    };
    
    const key = `${endpoint.provider}-${endpoint.name}`;
    return mapping[key] || 'provider-rotation';
  };

  const currentEndpoint = filteredEndpoints.find(e => e.name === selectedEndpoint);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Provider API Documentation</h2>
          <p className="text-muted-foreground">Interactive documentation and testing for all travel provider APIs</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Select Provider</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedProvider} onValueChange={(value: any) => setSelectedProvider(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="amadeus">Amadeus</SelectItem>
                <SelectItem value="hotelbeds">HotelBeds</SelectItem>
                <SelectItem value="sabre">Sabre</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Select Endpoint</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedEndpoint} onValueChange={setSelectedEndpoint}>
              <SelectTrigger>
                <SelectValue placeholder="Choose endpoint" />
              </SelectTrigger>
              <SelectContent>
                {filteredEndpoints.map(endpoint => (
                  <SelectItem key={endpoint.name} value={endpoint.name}>
                    {endpoint.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">Quick Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">{apiEndpoints.length}</div>
                <div className="text-xs text-muted-foreground">Total Endpoints</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{testResults.filter(r => r.success).length}</div>
                <div className="text-xs text-muted-foreground">Successful Tests</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">{testResults.filter(r => !r.success).length}</div>
                <div className="text-xs text-muted-foreground">Failed Tests</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {currentEndpoint && (
        <Tabs defaultValue="documentation" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="documentation">Documentation</TabsTrigger>
            <TabsTrigger value="parameters">Parameters</TabsTrigger>
            <TabsTrigger value="testing">Testing</TabsTrigger>
            <TabsTrigger value="examples">Examples</TabsTrigger>
          </TabsList>

          <TabsContent value="documentation" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Book className="h-5 w-5" />
                    {currentEndpoint.name}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Badge variant="outline">{currentEndpoint.method}</Badge>
                    <Badge variant="secondary">{currentEndpoint.provider}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">{currentEndpoint.description}</p>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label className="text-sm font-medium">Endpoint</Label>
                    <div className="mt-1 p-2 bg-muted rounded-md font-mono text-sm">
                      {currentEndpoint.endpoint}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Rate Limit</Label>
                    <div className="mt-1 p-2 bg-muted rounded-md text-sm">
                      {currentEndpoint.rateLimit}
                    </div>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Authentication</Label>
                  <div className="mt-1 p-2 bg-muted rounded-md text-sm">
                    {currentEndpoint.authentication}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Response Schema</Label>
                  <div className="mt-1 p-3 bg-muted rounded-md">
                    <pre className="text-xs overflow-auto">
                      {JSON.stringify(currentEndpoint.responseSchema, null, 2)}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="parameters" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Parameters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {currentEndpoint.parameters.map(param => (
                    <div key={param.name} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{param.name}</span>
                          {param.required && <Badge variant="destructive" className="h-5 text-xs">Required</Badge>}
                          <Badge variant="outline" className="h-5 text-xs">{param.type}</Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{param.description}</p>
                      {param.format && (
                        <div className="text-xs text-muted-foreground">
                          Format: <span className="font-mono">{param.format}</span>
                        </div>
                      )}
                      {param.example && (
                        <div className="text-xs text-muted-foreground">
                          Example: <span className="font-mono">{JSON.stringify(param.example)}</span>
                        </div>
                      )}
                      {param.validation && (
                        <div className="text-xs text-muted-foreground">
                          Validation: <span className="font-mono">{param.validation}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="testing" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TestTube className="h-5 w-5" />
                    Test Parameters
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {currentEndpoint.parameters.map(param => (
                    <div key={param.name}>
                      <Label htmlFor={param.name} className="text-sm">
                        {param.name}
                        {param.required && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      <Input
                        id={param.name}
                        placeholder={param.example?.toString() || `Enter ${param.name}`}
                        value={testParameters[param.name] || ''}
                        onChange={(e) => setTestParameters(prev => ({
                          ...prev,
                          [param.name]: e.target.value
                        }))}
                        className="mt-1"
                      />
                    </div>
                  ))}
                  
                  <Button 
                    onClick={() => testEndpoint(currentEndpoint)} 
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? 'Testing...' : 'Test Endpoint'}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Test Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {testResults.slice(0, 5).map((result, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {result.success ? 
                            <CheckCircle className="h-4 w-4 text-green-600" /> : 
                            <XCircle className="h-4 w-4 text-red-600" />
                          }
                          <div>
                            <div className="font-medium text-sm">{result.endpoint}</div>
                            <div className="text-xs text-muted-foreground">
                              {result.responseTime}ms
                            </div>
                          </div>
                        </div>
                        <Badge variant={result.success ? 'default' : 'destructive'}>
                          {result.success ? 'Success' : 'Failed'}
                        </Badge>
                      </div>
                    ))}
                    
                    {testResults.length === 0 && (
                      <div className="text-center text-muted-foreground py-8">
                        No test results yet. Run a test to see results here.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="examples" className="space-y-6">
            <div className="grid gap-6">
              {currentEndpoint.examples.map((example, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Code className="h-5 w-5" />
                      {example.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">{example.description}</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Request</Label>
                      <div className="mt-1 p-3 bg-muted rounded-md">
                        <pre className="text-xs overflow-auto">
                          {JSON.stringify(example.request, null, 2)}
                        </pre>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium">Response</Label>
                      <div className="mt-1 p-3 bg-muted rounded-md">
                        <pre className="text-xs overflow-auto">
                          {JSON.stringify(example.response, null, 2)}
                        </pre>
                      </div>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      onClick={() => setTestParameters(example.request)}
                      className="w-full"
                    >
                      Use This Example
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};