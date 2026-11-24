/** Build an absolute in-workspace path to a settings page (section/page segments only). */
export function settingsPagePath(workspacePath: (segment: string) => string, sectionAndPage: string): string {
  return workspacePath(`settings/${sectionAndPage}`);
}
