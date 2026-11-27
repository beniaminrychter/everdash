/**
* | output |
* | --- |
* | "{count} card" |
*
*/
export const admin_count_cards_one: ((inputs: Admin_Count_Cards_OneInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import("../runtime.js").MessageMetadata<Admin_Count_Cards_OneInputs, { locale?: "en" | "pl" }, {}>;
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Admin_Count_Cards_OneInputs = { count: NonNullable<unknown> };
