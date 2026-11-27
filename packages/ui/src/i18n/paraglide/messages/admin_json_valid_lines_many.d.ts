/**
* | output |
* | --- |
* | "Valid JSON · {count} lines" |
*
*/
export const admin_json_valid_lines_many: ((inputs: Admin_Json_Valid_Lines_ManyInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import("../runtime.js").MessageMetadata<Admin_Json_Valid_Lines_ManyInputs, { locale?: "en" | "pl" }, {}>;
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Admin_Json_Valid_Lines_ManyInputs = { count: NonNullable<unknown> };
