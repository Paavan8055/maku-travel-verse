import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import logger from "@/utils/logger";
import { 
  Users, 
  Building, 
  CreditCard, 
  TrendingUp
} from 'lucide-react';
