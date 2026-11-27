/**
* | output |
* | --- |
* | "Add card to {section}" |
*
*/
export const editor_add_card_to_section: ((inputs: Editor_Add_Card_To_SectionInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import("../runtime.js").MessageMetadata<Editor_Add_Card_To_SectionInputs, { locale?: "en" | "pl" }, {}>;
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Editor_Add_Card_To_SectionInputs = { section: NonNullable<unknown> };
