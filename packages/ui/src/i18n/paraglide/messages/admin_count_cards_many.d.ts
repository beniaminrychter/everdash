/**
* | output |
* | --- |
* | "{count} cards" |
*
*/
export const admin_count_cards_many: ((inputs: Admin_Count_Cards_ManyInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import("../runtime.js").MessageMetadata<Admin_Count_Cards_ManyInputs, { locale?: "en" | "pl" }, {}>;
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Admin_Count_Cards_ManyInputs = { count: NonNullable<unknown> };
