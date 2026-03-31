import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.earnpathway.app',
  appName: 'Good Wallet',
  webDir: 'dist',
  server: {
    url: 'https://87480a9c-e5b1-4361-9cb7-32ee1bcff207.lovableproject.com?forceHideBadge=true',
    cleartext: true
  }
};

export default config;
