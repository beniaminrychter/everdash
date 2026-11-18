import type { DashboardDocument } from '@everdash/contracts/config/types';

/**
 * Fills temporarily blank view or section titles with non-empty fallback labels so the live
 * preview continues to render while the user clears and edits names in the inspector.
 */
export function withPreviewTitles(document: DashboardDocument): DashboardDocument {
  const needsTitlePreview = document.views.some(
    (view) => !view.title.trim() || (view.sections ?? []).some((section) => !section.title.trim()),
  );

  if (!needsTitlePreview) {
    return document;
  }

  return {
    ...document,
    views: document.views.map((view) => ({
      ...view,
      title: view.title.trim() ? view.title : 'Untitled view',
      ...(view.sections
        ? {
            sections: view.sections.map((section) => ({
              ...section,
              title: section.title.trim() ? section.title : 'Untitled section',
            })),
          }
        : {}),
    })),
  };
}
