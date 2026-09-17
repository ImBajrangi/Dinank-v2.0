import { Platform, Linking } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import appConfig from '../../app.json';

export interface AppUpdateInfo {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseTitle: string;
  releaseNotes: string;
  downloadUrl: string;
  apkSize?: number;
  publishedAt?: string;
  htmlUrl: string;
}

export interface DownloadProgress {
  percent: number; // 0 - 100
  downloadedMB: string;
  totalMB: string;
}

// GitHub repo coordinates
const GITHUB_OWNER = 'ImBajrangi';
const GITHUB_REPO = 'Dinank-v2.0';
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`;

export const CURRENT_APP_VERSION = appConfig.expo?.version || '2.0.0';

// In-memory cache to prevent spamming GitHub API
let lastCheckTime = 0;
let cachedUpdateInfo: AppUpdateInfo | null = null;
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Compare two semver strings: '2.1.0' > '2.0.0' => true
 */
export function isVersionNewer(latest: string, current: string): boolean {
  const clean = (v: string) => v.replace(/^v/i, '').trim();
  const v1 = clean(latest).split('.').map((n) => parseInt(n, 10) || 0);
  const v2 = clean(current).split('.').map((n) => parseInt(n, 10) || 0);

  const len = Math.max(v1.length, v2.length);
  for (let i = 0; i < len; i++) {
    const a = v1[i] || 0;
    const b = v2[i] || 0;
    if (a > b) return true;
    if (a < b) return false;
  }
  return false;
}

export class AutoUpdateService {
  private static activeDownload: FileSystem.DownloadResumable | null = null;

  /**
   * Check GitHub Releases for the latest version
   */
  static async checkForUpdates(forceRefresh = false): Promise<AppUpdateInfo> {
    if (Platform.OS === 'web') {
      return {
        hasUpdate: false,
        currentVersion: CURRENT_APP_VERSION,
        latestVersion: CURRENT_APP_VERSION,
        releaseTitle: `Dinank v${CURRENT_APP_VERSION}`,
        releaseNotes: 'Web build is running the latest live version.',
        downloadUrl: '',
        htmlUrl: `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}`,
      };
    }

    const now = Date.now();
    if (!forceRefresh && cachedUpdateInfo && now - lastCheckTime < CACHE_TTL_MS) {
      return cachedUpdateInfo;
    }

    try {
      const response = await fetch(GITHUB_API_URL, {
        headers: {
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'Dinank-App-Updater',
        },
      });

      if (response.status === 404) {
        // No release published yet on GitHub repo
        const fallbackInfo: AppUpdateInfo = {
          hasUpdate: false,
          currentVersion: CURRENT_APP_VERSION,
          latestVersion: CURRENT_APP_VERSION,
          releaseTitle: `Dinank v${CURRENT_APP_VERSION}`,
          releaseNotes: 'You are on the latest development release.',
          downloadUrl: '',
          htmlUrl: `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}`,
        };
        cachedUpdateInfo = fallbackInfo;
        lastCheckTime = now;
        return fallbackInfo;
      }

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const release = await response.json();
      const tagName: string = release.tag_name || '';
      const versionNumber = tagName.replace(/^v/i, '').trim();
      const hasUpdate = isVersionNewer(versionNumber, CURRENT_APP_VERSION);

      // Find the APK file among release assets
      let apkDownloadUrl = '';
      let apkSize = 0;

      if (Array.isArray(release.assets)) {
        const apkAsset = release.assets.find(
          (a: any) => typeof a.name === 'string' && a.name.toLowerCase().endsWith('.apk')
        );
        if (apkAsset) {
          apkDownloadUrl = apkAsset.browser_download_url;
          apkSize = apkAsset.size;
        }
      }

      // Fallback if no asset uploaded yet
      if (!apkDownloadUrl) {
        apkDownloadUrl = release.html_url || `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases`;
      }

      const updateInfo: AppUpdateInfo = {
        hasUpdate,
        currentVersion: CURRENT_APP_VERSION,
        latestVersion: versionNumber || tagName || CURRENT_APP_VERSION,
        releaseTitle: release.name || `Dinank v${versionNumber}`,
        releaseNotes: release.body || 'Performance enhancements and new features.',
        downloadUrl: apkDownloadUrl,
        apkSize,
        publishedAt: release.published_at,
        htmlUrl: release.html_url || `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}`,
      };

      lastCheckTime = now;
      cachedUpdateInfo = updateInfo;
      return updateInfo;
    } catch (error) {
      // Offline fallback
      return {
        hasUpdate: false,
        currentVersion: CURRENT_APP_VERSION,
        latestVersion: CURRENT_APP_VERSION,
        releaseTitle: 'Dinank',
        releaseNotes: '',
        downloadUrl: `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases`,
        htmlUrl: `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}`,
      };
    }
  }

  /**
   * Download the APK file with real-time percentage and launch Android installer
   */
  static async downloadAndInstall(
    downloadUrl: string,
    onProgress: (progress: DownloadProgress) => void
  ): Promise<boolean> {
    if (Platform.OS !== 'android') {
      // On web / iOS open release webpage
      await Linking.openURL(downloadUrl);
      return true;
    }

    try {
      const filename = 'dinank-update.apk';
      const fileUri = `${FileSystem.cacheDirectory}${filename}`;

      // Clear previous cache if exists
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(fileUri, { idempotent: true });
      }

      const progressCallback = (dp: FileSystem.DownloadProgressData) => {
        if (dp.totalBytesExpectedToWrite > 0) {
          const ratio = dp.totalBytesWritten / dp.totalBytesExpectedToWrite;
          const percent = Math.min(100, Math.round(ratio * 100));
          const downloadedMB = (dp.totalBytesWritten / (1024 * 1024)).toFixed(1);
          const totalMB = (dp.totalBytesExpectedToWrite / (1024 * 1024)).toFixed(1);
          onProgress({ percent, downloadedMB, totalMB });
        } else {
          const downloadedMB = (dp.totalBytesWritten / (1024 * 1024)).toFixed(1);
          onProgress({ percent: 0, downloadedMB, totalMB: '...' });
        }
      };

      this.activeDownload = FileSystem.createDownloadResumable(
        downloadUrl,
        fileUri,
        {},
        progressCallback
      );

      const result = await this.activeDownload.downloadAsync();
      this.activeDownload = null;

      if (!result || !result.uri) {
        throw new Error('Download did not complete.');
      }

      // Convert file URI to Android Content URI
      const contentUri = await FileSystem.getContentUriAsync(result.uri);

      // Launch Android package installer intent
      await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
        data: contentUri,
        flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
        type: 'application/vnd.android.package-archive',
      });

      return true;
    } catch (error) {
      console.warn('AutoUpdateService install failed, opening fallback link:', error);
      // Fallback to browser download if local intent failed
      try {
        await Linking.openURL(downloadUrl);
      } catch (e) {}
      return false;
    }
  }

  /**
   * Cancel active download if user closes modal
   */
  static async cancelDownload() {
    if (this.activeDownload) {
      try {
        await this.activeDownload.cancelAsync();
      } catch (e) {}
      this.activeDownload = null;
    }
  }
}
