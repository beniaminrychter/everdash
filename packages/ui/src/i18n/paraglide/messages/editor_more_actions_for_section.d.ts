/**
* | output |
* | --- |
* | "More actions for section {name}" |
*
*/
export const editor_more_actions_for_section: ((inputs: Editor_More_Actions_For_SectionInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import("../runtime.js").MessageMetadata<Editor_More_Actions_For_SectionInputs, { locale?: "en" | "pl" }, {}>;
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Editor_More_Actions_For_SectionInputs = { name: NonNullable<unknown> };
