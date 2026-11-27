/**
* | output |
* | --- |
* | "-{count} removed" |
*
*/
export const admin_json_diff_removed: ((inputs: Admin_Json_Diff_RemovedInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import("../runtime.js").MessageMetadata<Admin_Json_Diff_RemovedInputs, { locale?: "en" | "pl" }, {}>;
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Admin_Json_Diff_RemovedInputs = { count: NonNullable<unknown> };
