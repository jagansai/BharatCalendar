# Android Release Process

This guide outlines the steps required to prepare and build an Android release for deployment to the Google Play Store.

## Prerequisites

- Ensure you have the upload keystore configured in `android/gradle.properties` or `%USERPROFILE%\.gradle\gradle.properties`
- Required properties: `MYAPP_UPLOAD_STORE_FILE`, `MYAPP_UPLOAD_KEY_ALIAS`, `MYAPP_UPLOAD_STORE_PASSWORD`, `MYAPP_UPLOAD_KEY_PASSWORD`

## Step 1: Update Version in package.json

Increment the version number following semantic versioning (major.minor.patch).

**Location:** `package.json`

```json
{
  "name": "TeluguFestivalReminderClean",
   "version": "1.2.7",  // ← Update this (e.g., 1.2.6 → 1.2.7)
  "private": true,
  ...
}
```

**Version Guidelines:**
- **Patch** (x.x.1): Bug fixes, minor updates, data updates
- **Minor** (x.1.0): New features, non-breaking changes
- **Major** (2.0.0): Breaking changes, major redesign

## Step 2: Update Android Version in build.gradle

Update both `versionCode` and `versionName` in the Android app configuration.

**Location:** `android/app/build.gradle`

```gradle
android {
    ...
    defaultConfig {
        applicationId "com.telugufestivalreminderclean"
        minSdkVersion rootProject.ext.minSdkVersion
        targetSdkVersion rootProject.ext.targetSdkVersion
         versionCode 10          // ← Increment by 1 (e.g., 9 → 10) - REQUIRED
         versionName "1.2.7"     // ← Match package.json version
    }
    ...
}
```

**Important Notes:**
- **versionCode**: Must be incremented for every Play Store release. This is an integer that must always increase.
- **versionName**: Human-readable version string shown to users. Should match `package.json` version.
- Play Store will reject submissions with duplicate or lower versionCode values.

## Step 3: Build the Release

Use the build script to create a release AAB (Android App Bundle) for Play Store submission.

**Command:**
```powershell
.\scripts\build-android.ps1 -Release -FestivalsToken te_festivals2026
```

**Parameters:**
- `-Release`: Build for production (requires upload keystore)
- `-FestivalsToken`: Specifies which festival data files to include
  - `te_festivals2026`: Uses only 2026 data
  - `te_festivals`: Merges all matching files (2025 + 2026)
  - Adjust year as needed for future releases

**Build Output:**
- AAB file location: `android/app/build/outputs/bundle/release/app-release.aab`
- This is the file you upload to Google Play Console

## Step 4: Upload to Play Store

1. Go to [Google Play Console](https://play.google.com/console)
2. Select your app
3. Navigate to **Release** → **Production** (or Testing track)
4. Create new release
5. Upload the `app-release.aab` file
6. Fill in release notes describing changes
7. Review and roll out

## Quick Reference Checklist

- [ ] Update `package.json` and `package-lock.json` version to 1.2.7
- [ ] Update `android/app/build.gradle` versionCode to 10
- [ ] Update `android/app/build.gradle` versionName to "1.2.7"
- [ ] Run build command: `.\scripts\build-android.ps1 -Release -FestivalsToken <token>`
- [ ] Verify AAB created: `android/app/build/outputs/bundle/release/app-release.aab`
- [ ] Upload AAB to Google Play Console
- [ ] Add release notes
- [ ] Submit for review

## Example Release Cycle

**Scenario:** Updating festival data for 2026 and widget behavior

1. **Version Update:**
   - Current: 1.2.6 (versionCode 9)
   - New: 1.2.7 (versionCode 10)

2. **Files to Edit:**
   ```
   package.json:          "version": "1.2.7"
   package-lock.json:     root version "1.2.7"
   android/app/build.gradle:
      versionCode 10
      versionName "1.2.7"
   ```

3. **Build Command:**
   ```powershell
   .\scripts\build-android.ps1 -Release -FestivalsToken te_festivals2026
   ```

4. **Result:**
   - AAB with version 1.2.7 (versionCode 10) ready for Play Store

## Troubleshooting

**Build fails with keystore error:**
- Ensure upload keystore properties are set in `android/gradle.properties` or `%USERPROFILE%\.gradle\gradle.properties`
- Verify keystore file exists at the specified path

**Play Store rejects upload:**
- Check versionCode is higher than previous release
- Ensure you're targeting the correct API level (targetSdkVersion)

**Festival data not included:**
- Verify the `-FestivalsToken` parameter matches your data files
- Check that `assets/te_festivals*.json` files exist
