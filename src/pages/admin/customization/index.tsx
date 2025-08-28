import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BrandingCustomizer } from '@/components/theme/BrandingCustomizer';
import { KeyboardShortcutsManager } from '@/components/power-user/KeyboardShortcutsManager';

const AdminCustomizationPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Platform Customization</h1>
        <p className="text-muted-foreground">
          Customize branding, themes, and power user features
        </p>
      </div>

      <Tabs defaultValue="branding" className="space-y-6">
        <TabsList>
          <TabsTrigger value="branding">Branding & Themes</TabsTrigger>
          <TabsTrigger value="shortcuts">Keyboard Shortcuts</TabsTrigger>
          <TabsTrigger value="widgets">Dashboard Widgets</TabsTrigger>
          <TabsTrigger value="mobile">Mobile & PWA</TabsTrigger>
        </TabsList>

        <TabsContent value="branding">
          <BrandingCustomizer />
        </TabsContent>

        <TabsContent value="shortcuts">
          <KeyboardShortcutsManager />
        </TabsContent>

        <TabsContent value="widgets">
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold mb-2">Dashboard Widgets</h3>
            <p className="text-muted-foreground">
              Custom dashboard widget builder coming soon
            </p>
          </div>
        </TabsContent>

        <TabsContent value="mobile">
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold mb-2">Mobile & PWA Settings</h3>
            <p className="text-muted-foreground">
              Progressive web app configuration coming soon
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminCustomizationPage;