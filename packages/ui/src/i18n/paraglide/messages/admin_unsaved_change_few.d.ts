/**
* | output |
* | --- |
* | "{count} unsaved changes" |
*
*/
export const admin_unsaved_change_few: ((inputs: Admin_Unsaved_Change_FewInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import("../runtime.js").MessageMetadata<Admin_Unsaved_Change_FewInputs, { locale?: "en" | "pl" }, {}>;
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Admin_Unsaved_Change_FewInputs = { count: NonNullable<unknown> };
