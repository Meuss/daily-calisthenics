// Lets the release workflow stamp the version from the tag without committing it.
module.exports = ({ config }) => ({
  ...config,
  version: process.env.APP_VERSION ?? config.version,
  android: {
    ...config.android,
    versionCode: process.env.APP_VERSION_CODE ? Number(process.env.APP_VERSION_CODE) : config.android?.versionCode,
  },
});
