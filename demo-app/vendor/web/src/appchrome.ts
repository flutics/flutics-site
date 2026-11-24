/** Per-app actions registered by AppView while its tab is active. */
export type AppChrome = {
  slug: string;
  name: string;
  version: string;
  focusHref: string;
  shellHref: string;
  reload: () => void;
  openManifest: () => void;
};
