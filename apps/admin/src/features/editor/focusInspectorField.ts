/**
 * Focuses a field in the editor dialog once it has rendered. The dialog mounts after the
 * selection changes, so the field is looked up after a short wait.
 */
export function focusInspectorField(id: string) {
  window.setTimeout(() => {
    const input = document.querySelector<HTMLInputElement>(`#${id}`);

    input?.focus();
    input?.select();
  }, 150);
}
