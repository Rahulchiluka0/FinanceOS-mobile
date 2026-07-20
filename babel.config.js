module.exports = function (api) {
  api.cache(true)
  return {
    presets: ['babel-preset-expo'],
    // NativeWind babel remaps Pressable styles and was wiping button backgrounds in Expo Go.
    // Re-enable only if you adopt className-based styling end-to-end.
    plugins: [
      [
        'module-resolver',
        {
          root: ['.'],
          alias: { '@': './src' },
          extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
        },
      ],
      'react-native-reanimated/plugin',
    ],
  }
}
