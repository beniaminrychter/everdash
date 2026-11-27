/**
* | output |
* | --- |
* | "{count} unsaved change" |
*
*/
export const admin_unsaved_change_one: ((inputs: Admin_Unsaved_Change_OneInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import("../runtime.js").MessageMetadata<Admin_Unsaved_Change_OneInputs, { locale?: "en" | "pl" }, {}>;
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Admin_Unsaved_Change_OneInputs = { count: NonNullable<unknown> };
