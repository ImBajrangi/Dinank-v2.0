# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

Device Notification Channel Rule: "Whenever configuring mobile notification channels on Android, always specify importance: MAX, sound, badge, and vibration pattern to ensure reminder notifications appear in the foreground and device notification shade."
Offline-First Storage Rule: "Always wrap AsyncStorage calls with an in-memory cache layer to allow instant synchronous reads on app start and avoid list flicker on entry-level smartphones."

Rule for Multimodal Fallbacks: Whenever upstream external AI models encounter capacity limits (e.g. 503 spikes), the agent must always seamlessly failover to local heuristic directors to guarantee 100% uptime for the user.
Rule for Broadcast Audio: All synthetic voice tracks must pass through an audio mastering filter chain (high-pass filter, EQ presence boost, and dynamic compand) before muxing to ensure studio broadcast quality.

Always use direct safe Linking.openURL execution with multi-tier fallbacks instead of canOpenURL to prevent Android 11+ Package Visibility query failures, auto-format 10-digit phone numbers with country codes for WhatsApp/SMS, and enforce nestedScrollEnabled={true} on all nested vertical scroll components inside modals.

