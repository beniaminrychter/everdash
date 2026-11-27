/**
* | output |
* | --- |
* | "Line {line}: {message}" |
*
*/
export const admin_json_line_error: ((inputs: Admin_Json_Line_ErrorInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import("../runtime.js").MessageMetadata<Admin_Json_Line_ErrorInputs, { locale?: "en" | "pl" }, {}>;
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Admin_Json_Line_ErrorInputs = { line: NonNullable<unknown>, message: NonNullable<unknown> };
