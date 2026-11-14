const keys = new WeakMap<object, string>();
let sequence = 0;

/** Editor identities are kept outside dashboard JSON and follow objects through reordering. */
export function editorKeys(items: readonly object[]): string[] {
  return items.map((item) => {
    let key = keys.get(item);
    if (!key) {
      sequence += 1;
      key = `editor-card-${sequence}`;
      keys.set(item, key);
    }
    return key;
  });
}
