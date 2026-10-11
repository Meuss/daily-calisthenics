# Daily Calisthenics

**A short bodyweight routine every morning — no gym, no account, no excuses.**

Daily Calisthenics is a small, free Android app that tells you exactly what to do each morning: a short guided circuit with simple illustrations, reps or a timer for every move, and a Streak that forgives the occasional bad day.

<p align="center">
  <img src="docs/screenshots/today.png" alt="Today screen" width="240">
  <img src="docs/screenshots/session.png" alt="A Session in progress" width="240">
  <img src="docs/screenshots/progress.png" alt="Progress screen" width="240">
</p>

## Features

- **Guided Sessions**: Warm-up, then 3 Rounds of 4 Exercises with countdowns, beeps and vibration. Short enough to fit every morning.
- **Starts where you are**: three questions place you on each Progression (wall push-ups to diamond push-ups, and more). Floor and a chair are all you need.
- **Gets harder as you do**: rate each Exercise *too easy / OK / too hard* and the app suggests more reps or the next Step.
- **Bad day? Short Routine**: a 3-minute version still keeps your Streak alive, and a weekly Freeze covers a missed day.
- **Weigh-ins**: one tap after your Session, with a 7-day average chart.
- **Achievements and Reminders** to keep you coming back.
- **Private**: everything stays on your phone. Export a backup file whenever you like.

## Install

1. On your Android phone, open the [latest release](https://github.com/Meuss/daily-calisthenics/releases/latest) and download `daily-calisthenics-<version>.apk`.
2. Open the downloaded file. Android will ask you to allow installs from your browser or Files app — allow it for this install.
3. If Play Protect warns that it doesn't recognise the app, choose **Install anyway** (it isn't on the Play Store).

Updates: install the newer APK from Releases the same way; your history stays on the phone. Export a backup from Settings first if you like.

### Try it without installing

On a computer with Node.js and pnpm: `git clone https://github.com/Meuss/daily-calisthenics && cd daily-calisthenics && pnpm install && pnpm start`, then scan the QR code with Expo Go for SDK 57 ([expo.dev/go](https://expo.dev/go)). Expo Go can't schedule notifications, so morning Reminders only work in the installed app.

## Development

    pnpm install
    pnpm test           # unit tests (domain rules and app logic)
    pnpm typecheck
    pnpm check:bundle   # builds the Android JS bundle

- Vocabulary: [`CONTEXT.md`](CONTEXT.md) · Design: [`docs/superpowers/specs/2026-10-10-daily-calisthenics-design.md`](docs/superpowers/specs/2026-10-10-daily-calisthenics-design.md)
- Manual test pass on a phone: [`docs/device-checklist.md`](docs/device-checklist.md)

## Built with

- [Expo](https://expo.dev) SDK 57 and [React Native](https://reactnative.dev) 0.86, written in TypeScript
- [Expo Router](https://docs.expo.dev/router/introduction/) for navigation
- [expo-sqlite](https://docs.expo.dev/versions/latest/sdk/sqlite/) for on-device storage (an append-only event log — see [`docs/adr`](docs/adr))
- [expo-notifications](https://docs.expo.dev/versions/latest/sdk/notifications/), expo-audio and expo-keep-awake for Reminders and Session cues
- [react-native-svg](https://github.com/software-mansion/react-native-svg) for the stick-figure illustrations and charts
- [Zod](https://zod.dev) for validating stored data and backups
- [Vitest](https://vitest.dev) for tests, [pnpm](https://pnpm.io) for packages
- [GitHub Actions](https://docs.github.com/actions) for building and releasing the APK

## Deployment

Releases are built and signed by GitHub Actions ([`.github/workflows/release.yml`](.github/workflows/release.yml)); there is no Expo/EAS account involved.

**Publish a release**

    git tag -a v1.2.3 -m "Daily Calisthenics 1.2.3"
    git push origin v1.2.3

The workflow runs the tests, generates the Android project (`expo prebuild`), builds a release APK with Gradle, checks it is signed with the release certificate, and attaches `daily-calisthenics-1.2.3.apk` to a GitHub Release. Tags must look like `vMAJOR.MINOR.PATCH` with minor and patch below 100; the version code is `major*10000 + minor*100 + patch`, so every release installs over the previous one.

**Test build without publishing**: run the *Release APK* workflow manually (Actions tab → *Run workflow*, or `gh workflow run release.yml`). The APK is attached to the run as an artifact.

**Signing**: the workflow reads four repository secrets — `RELEASE_KEYSTORE_BASE64`, `RELEASE_STORE_PASSWORD`, `RELEASE_KEY_ALIAS`, `RELEASE_KEY_PASSWORD` — and refuses to build without them. Keep a backup of the keystore: an APK signed with a different key can't update the installed app. If you fork this project, create your own key with `keytool`, set those secrets, and update `RELEASE_CERT_SHA256` in the workflow.

**Build locally** (needs JDK 17 and the Android SDK with NDK 27.1.12297006):

    pnpm install
    pnpm expo prebuild --platform android --no-install
    cd android && ./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a,armeabi-v7a

Without the `RELEASE_*` environment variables the APK is signed with the debug key — fine for testing, not for distributing. Set `RELEASE_STORE_FILE` (path to the keystore) plus the three passwords/alias variables to sign with the release key.

**Icons**: they are drawn in code; edit [`scripts/make-icons.mjs`](scripts/make-icons.mjs) and run `pnpm icons`.

## License

[MIT](LICENSE)
