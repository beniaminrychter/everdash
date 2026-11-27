/**
* | output |
* | --- |
* | "{count} cards" |
*
*/
export const admin_count_cards_few: ((inputs: Admin_Count_Cards_FewInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import("../runtime.js").MessageMetadata<Admin_Count_Cards_FewInputs, { locale?: "en" | "pl" }, {}>;
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Admin_Count_Cards_FewInputs = { count: NonNullable<unknown> };
