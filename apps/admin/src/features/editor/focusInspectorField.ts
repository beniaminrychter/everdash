/**
 * Focuses a field in the inspector once it has rendered. Below lg the inspector is a sheet that
 * mounts after the selection changes, so the field is looked up after a short wait.
 */
export function focusInspectorField(id: string) {
  window.setTimeout(() => {
    const input = document.querySelector<HTMLInputElement>(`#${id}`);

    input?.focus();
    input?.select();
  }, 150);
}
