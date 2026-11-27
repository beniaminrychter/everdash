/**
* | output |
* | --- |
* | "URL for {name}" |
*
*/
export const admin_signin_url_for: ((inputs: Admin_Signin_Url_ForInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import("../runtime.js").MessageMetadata<Admin_Signin_Url_ForInputs, { locale?: "en" | "pl" }, {}>;
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Admin_Signin_Url_ForInputs = { name: NonNullable<unknown> };
