/**
 * Health Connect Expo Config Plugin
 *
 * Adds the required Android manifest configuration for Health Connect:
 * 1. Privacy Dashboard intent filter (ACTION_SHOW_PERMISSIONS_RATIONALE)
 * 2. Android 14+ VIEW_PERMISSION_USAGE intent filter
 *
 * Reference: https://matinzd.github.io/react-native-health-connect/docs/permissions
 */

const { withAndroidManifest } = require('@expo/config-plugins');

const withHealthConnect = (config) => {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;

    // Find the main application element
    const mainApplication = androidManifest.manifest.application?.[0];
    if (!mainApplication) {
      console.warn('[Health Connect Plugin] No application element found in AndroidManifest.xml');
      return config;
    }

    // Find or create the MainActivity
    let mainActivity = mainApplication.activity?.find(
      (activity) => activity.$?.['android:name'] === '.MainActivity'
    );

    if (!mainActivity) {
      console.warn('[Health Connect Plugin] MainActivity not found');
      return config;
    }

    // Ensure intent-filter array exists
    if (!mainActivity['intent-filter']) {
      mainActivity['intent-filter'] = [];
    }

    // Check if Health Connect intent filter already exists
    const hasHealthConnectIntentFilter = mainActivity['intent-filter'].some((filter) =>
      filter?.action?.some(
        (action) =>
          action?.$?.['android:name'] === 'androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE'
      )
    );

    // Add Health Connect Privacy Dashboard intent filter if not present
    if (!hasHealthConnectIntentFilter) {
      mainActivity['intent-filter'].push({
        action: [
          {
            $: {
              'android:name': 'androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE',
            },
          },
        ],
        category: [
          {
            $: {
              'android:name': 'android.intent.category.DEFAULT',
            },
          },
        ],
      });
    }

    // Add activity-alias for Android 14+ (VIEW_PERMISSION_USAGE)
    // This is required for the Health Connect permission rationale on Android 14+
    const hasPermissionUsageAlias = mainApplication['activity-alias']?.some(
      (alias) => alias.$?.['android:name'] === '.HealthConnectPermissionRationale'
    );

    if (!hasPermissionUsageAlias) {
      if (!mainApplication['activity-alias']) {
        mainApplication['activity-alias'] = [];
      }

      mainApplication['activity-alias'].push({
        $: {
          'android:name': '.HealthConnectPermissionRationale',
          'android:targetActivity': '.MainActivity',
          'android:exported': 'true',
        },
        'intent-filter': [
          {
            action: [
              {
                $: {
                  'android:name': 'android.intent.action.VIEW_PERMISSION_USAGE',
                },
              },
            ],
            category: [
              {
                $: {
                  'android:name': 'android.intent.category.HEALTH_PERMISSIONS',
                },
              },
            ],
          },
        ],
      });
    }

    return config;
  });
};

module.exports = withHealthConnect;
