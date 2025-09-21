// Logo Resolver for Emergent Upload System
// This utility helps locate and access user-uploaded logos

export interface LogoConfig {
  filename: string;
  fallbacks: string[];
}

export const LOGO_CONFIGS: Record<string, LogoConfig> = {
  'full-circular': {
    filename: 'maku-logo-full-circular.png',
    fallbacks: [
      '/logos/maku-logo-full-circular.png',
      '/assets/maku-logo-full-circular.png', 
      '/lovable-uploads/maku-logo-full-circular.png',
      '/uploads/maku-logo-full-circular.png',
      // Try generic logo names
      '/logos/logo-full.png',
      '/assets/logo-full.png'
    ]
  },
  'head-circular': {
    filename: 'maku-logo-head-circular.png',
    fallbacks: [
      '/logos/maku-logo-head-circular.png',
      '/assets/maku-logo-head-circular.png',
      '/lovable-uploads/maku-logo-head-circular.png', 
      '/uploads/maku-logo-head-circular.png',
      // Try generic logo names
      '/logos/logo-head.png',
      '/assets/logo-head.png'
    ]
  },
  'complete': {
    filename: 'maku-logo-complete.png',
    fallbacks: [
      '/logos/maku-logo-complete.png',
      '/assets/maku-logo-complete.png',
      '/lovable-uploads/maku-logo-complete.png',
      '/uploads/maku-logo-complete.png',
      // Try generic logo names
      '/logos/logo-complete.png',
      '/assets/logo-complete.png'
    ]
  },
  'text-only': {
    filename: 'maku-logo-text-only.png',
    fallbacks: [
      '/logos/maku-logo-text-only.png',
      '/assets/maku-logo-text-only.png',
      '/lovable-uploads/maku-logo-text-only.png',
      '/uploads/maku-logo-text-only.png',
      // Try generic logo names
      '/logos/logo-text.png',
      '/assets/logo-text.png'
    ]
  }
};

export class LogoResolver {
  private static checkedPaths: Set<string> = new Set();
  private static workingPaths: Map<string, string> = new Map();

  static async findWorkingLogoPath(logoType: keyof typeof LOGO_CONFIGS): Promise<string> {
    // Return cached working path if available
    if (this.workingPaths.has(logoType)) {
      return this.workingPaths.get(logoType)!;
    }

    const config = LOGO_CONFIGS[logoType];
    
    // Try each fallback path
    for (const path of config.fallbacks) {
      if (this.checkedPaths.has(path)) continue;
      
      try {
        // Test if image loads
        const response = await fetch(path, { method: 'HEAD' });
        if (response.ok) {
          this.workingPaths.set(logoType, path);
          console.log(`✅ Found working logo path for ${logoType}: ${path}`);
          return path;
        }
      } catch (error) {
        // Path doesn't work, mark as checked
        this.checkedPaths.add(path);
      }
    }

    // No working path found, return first fallback as default
    console.warn(`❌ No working logo path found for ${logoType}, using default: ${config.fallbacks[0]}`);
    return config.fallbacks[0];
  }

  static getLogoSrc(logoType: keyof typeof LOGO_CONFIGS): string {
    // Return cached path if available
    if (this.workingPaths.has(logoType)) {
      return this.workingPaths.get(logoType)!;
    }

    // Return first fallback as default
    return LOGO_CONFIGS[logoType].fallbacks[0];
  }

  static async preloadLogos(): Promise<void> {
    console.log('🔍 Preloading Maku.Travel logos...');
    
    const logoTypes = Object.keys(LOGO_CONFIGS) as Array<keyof typeof LOGO_CONFIGS>;
    
    await Promise.all(
      logoTypes.map(async (logoType) => {
        try {
          await this.findWorkingLogoPath(logoType);
        } catch (error) {
          console.warn(`Failed to preload ${logoType} logo:`, error);
        }
      })
    );

    console.log('✅ Logo preloading complete');
  }
}

export default LogoResolver;