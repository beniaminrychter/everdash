/**
* | output |
* | --- |
* | "{count} unsaved changes" |
*
*/
export const admin_unsaved_change_many: ((inputs: Admin_Unsaved_Change_ManyInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import("../runtime.js").MessageMetadata<Admin_Unsaved_Change_ManyInputs, { locale?: "en" | "pl" }, {}>;
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Admin_Unsaved_Change_ManyInputs = { count: NonNullable<unknown> };
