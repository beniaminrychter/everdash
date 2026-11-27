/**
* | output |
* | --- |
* | "{count} issues" |
*
*/
export const admin_json_issues_few: ((inputs: Admin_Json_Issues_FewInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import("../runtime.js").MessageMetadata<Admin_Json_Issues_FewInputs, { locale?: "en" | "pl" }, {}>;
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Admin_Json_Issues_FewInputs = { count: NonNullable<unknown> };
