/**
* | output |
* | --- |
* | "The login request was not valid or has expired. Check the address and try again." |
*
*/
export const admin_auth_invalid_request: ((inputs?: Admin_Auth_Invalid_RequestInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import("../runtime.js").MessageMetadata<Admin_Auth_Invalid_RequestInputs, { locale?: "en" | "pl" }, {}>;
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Admin_Auth_Invalid_RequestInputs = {};
