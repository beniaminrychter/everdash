/**
* | output |
* | --- |
* | "Select {name}" |
*
*/
export const editor_select_item: ((inputs: Editor_Select_ItemInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import("../runtime.js").MessageMetadata<Editor_Select_ItemInputs, { locale?: "en" | "pl" }, {}>;
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Editor_Select_ItemInputs = { name: NonNullable<unknown> };
