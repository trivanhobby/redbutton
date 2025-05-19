const { notarize } = require('electron-notarize');
const path = require('path');
const fs = require('fs');

exports.default = async function (context) {
  const { electronPlatformName, appOutDir, packager } = context;

  if (electronPlatformName !== 'darwin') {
    return;
  }

  console.log('Notarizing macOS app...');

  const appName = packager.appInfo.productFilename;
  const appPath = path.join(appOutDir, `${appName}.app`);

  if (!fs.existsSync(appPath)) {
    console.log(`Skipping notarization: ${appPath} does not exist`);
    return;
  }

  const appleId = process.env.APPLE_ID;
  const appleIdPassword = process.env.APPLE_APP_PASSWORD; // ← проверь правильность переменной
  const appleTeamId = process.env.APPLE_TEAM_ID;

  if (!appleId || !appleIdPassword || !appleTeamId) {
    throw new Error('Missing Apple credentials for notarization. Set APPLE_ID, APPLE_APP_PASSWORD, and APPLE_TEAM_ID.');
  }

  await notarize({
    appBundleId: 'com.redbutton.app',
    appPath,
    appleId,
    appleIdPassword,
    teamId: appleTeamId,
  });

  console.log('Notarization complete.');
};