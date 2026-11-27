/**
* | output |
* | --- |
* | "That Home Assistant user is not an administrator. Sign in with an administrator account." |
*
*/
export const admin_auth_not_admin: ((inputs?: Admin_Auth_Not_AdminInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import("../runtime.js").MessageMetadata<Admin_Auth_Not_AdminInputs, { locale?: "en" | "pl" }, {}>;
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Admin_Auth_Not_AdminInputs = {};
