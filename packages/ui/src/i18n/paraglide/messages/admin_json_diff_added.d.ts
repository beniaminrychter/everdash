/**
* | output |
* | --- |
* | "+{count} added" |
*
*/
export const admin_json_diff_added: ((inputs: Admin_Json_Diff_AddedInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import("../runtime.js").MessageMetadata<Admin_Json_Diff_AddedInputs, { locale?: "en" | "pl" }, {}>;
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Admin_Json_Diff_AddedInputs = { count: NonNullable<unknown> };
