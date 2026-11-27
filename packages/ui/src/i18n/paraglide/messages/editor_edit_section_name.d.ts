/**
* | output |
* | --- |
* | "Edit section {name}" |
*
*/
export const editor_edit_section_name: ((inputs: Editor_Edit_Section_NameInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import("../runtime.js").MessageMetadata<Editor_Edit_Section_NameInputs, { locale?: "en" | "pl" }, {}>;
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Editor_Edit_Section_NameInputs = { name: NonNullable<unknown> };
