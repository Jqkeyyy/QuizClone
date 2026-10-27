import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  // Change this to a reverse-DNS ID you own before submitting to the App Store.
  appId: 'com.jqkeyyy.flashcards',
  appName: 'Cardwise',
  webDir: 'dist',
  ios: {
    contentInset: 'never',
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 500,
    },
  },
}

export default config
