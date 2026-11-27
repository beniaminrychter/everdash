/**
* | output |
* | --- |
* | "More actions for {name}" |
*
*/
export const editor_more_actions_for: ((inputs: Editor_More_Actions_ForInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import("../runtime.js").MessageMetadata<Editor_More_Actions_ForInputs, { locale?: "en" | "pl" }, {}>;
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Editor_More_Actions_ForInputs = { name: NonNullable<unknown> };
