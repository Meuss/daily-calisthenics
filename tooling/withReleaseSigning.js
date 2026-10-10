// Expo config plugin: sign release builds with the key passed in RELEASE_* environment variables (see release.yml).
const { withAppBuildGradle } = require('expo/config-plugins');

const RELEASE_CONFIG = `
        release {
            if (System.getenv('RELEASE_STORE_FILE')) {
                storeFile file(System.getenv('RELEASE_STORE_FILE'))
                storePassword System.getenv('RELEASE_STORE_PASSWORD')
                keyAlias System.getenv('RELEASE_KEY_ALIAS')
                keyPassword System.getenv('RELEASE_KEY_PASSWORD')
            }
        }`;

function applyReleaseSigning(gradle) {
  if (gradle.includes('RELEASE_STORE_FILE')) return gradle;

  const withConfig = gradle.replace(/(signingConfigs\s*\{\s*debug\s*\{[^}]*\})/, `$1${RELEASE_CONFIG}`);
  const withBuildType = withConfig.replace(
    /(buildTypes\s*\{[\s\S]*?release\s*\{[^}]*?)signingConfig signingConfigs\.debug/,
    "$1signingConfig System.getenv('RELEASE_STORE_FILE') ? signingConfigs.release : signingConfigs.debug",
  );

  if (withConfig === gradle || withBuildType === withConfig) {
    throw new Error('withReleaseSigning: android/app/build.gradle no longer matches the expected template');
  }
  return withBuildType;
}

function withReleaseSigning(config) {
  return withAppBuildGradle(config, (cfg) => {
    cfg.modResults.contents = applyReleaseSigning(cfg.modResults.contents);
    return cfg;
  });
}

module.exports = withReleaseSigning;
module.exports.applyReleaseSigning = applyReleaseSigning;
