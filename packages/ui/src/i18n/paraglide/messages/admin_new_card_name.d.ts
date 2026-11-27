/**
* | output |
* | --- |
* | "New {kind}" |
*
*/
export const admin_new_card_name: ((inputs: Admin_New_Card_NameInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import("../runtime.js").MessageMetadata<Admin_New_Card_NameInputs, { locale?: "en" | "pl" }, {}>;
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Admin_New_Card_NameInputs = { kind: NonNullable<unknown> };
