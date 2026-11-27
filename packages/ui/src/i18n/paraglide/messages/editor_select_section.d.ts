/**
* | output |
* | --- |
* | "Select section {name}" |
*
*/
export const editor_select_section: ((inputs: Editor_Select_SectionInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import("../runtime.js").MessageMetadata<Editor_Select_SectionInputs, { locale?: "en" | "pl" }, {}>;
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Editor_Select_SectionInputs = { name: NonNullable<unknown> };
