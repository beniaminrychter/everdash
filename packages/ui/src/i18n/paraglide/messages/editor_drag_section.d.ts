/**
* | output |
* | --- |
* | "Drag section {name}" |
*
*/
export const editor_drag_section: ((inputs: Editor_Drag_SectionInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import("../runtime.js").MessageMetadata<Editor_Drag_SectionInputs, { locale?: "en" | "pl" }, {}>;
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Editor_Drag_SectionInputs = { name: NonNullable<unknown> };
