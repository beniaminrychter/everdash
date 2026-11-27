/**
* | output |
* | --- |
* | "Edit {name}" |
*
*/
export const editor_edit_item: ((inputs: Editor_Edit_ItemInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import("../runtime.js").MessageMetadata<Editor_Edit_ItemInputs, { locale?: "en" | "pl" }, {}>;
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Editor_Edit_ItemInputs = { name: NonNullable<unknown> };
