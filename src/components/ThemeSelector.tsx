import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Theme {
  id: string;
  name: string;
  image: string;
  gradient: string;
}

interface ThemeSelectorProps {
  themes: Theme[];
  selectedTheme: Theme;
  onThemeSelect: (theme: Theme) => void;
}

const ThemeSelector = ({ themes, selectedTheme, onThemeSelect }: ThemeSelectorProps) => {
  return (
    <div>
      <label className="text-sm font-medium mb-3 block text-foreground">
        Choose Destination Theme
      </label>
      <div className="grid grid-cols-2 gap-3">
        {themes.map((theme) => (
          <button
            key={theme.id}
            onClick={() => onThemeSelect(theme)}
            className={cn(
              "relative overflow-hidden rounded-xl border-2 transition-all duration-300 hover:scale-105",
              selectedTheme.id === theme.id
                ? "border-primary shadow-card"
                : "border-border hover:border-primary/50"
            )}
          >
            <div className="aspect-[16/9] relative">
              <img
                src={theme.image}
                alt={theme.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              
              {/* Selection indicator */}
              {selectedTheme.id === theme.id && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-primary-foreground" />
                </div>
              )}
              
              {/* Theme name */}
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <h4 className="text-white font-medium text-sm">{theme.name}</h4>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ThemeSelector;