export const appConfig = {
  e2b: {
    timeoutMs: 300000, // 5 minutes
    vitePort: 5173,
    viteStartupDelay: 5000, // 5 seconds
  },
  packages: {
    useLegacyPeerDeps: true,
    autoRestartVite: true,
  },
};
