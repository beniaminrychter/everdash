/**
* | output |
* | --- |
* | "The EverDash server cannot reach Home Assistant at that address. If EverDash runs in a container, localhost points at the container itself. Use your Home Ass..." |
*
*/
export const admin_auth_ha_unreachable: ((inputs?: Admin_Auth_Ha_UnreachableInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import("../runtime.js").MessageMetadata<Admin_Auth_Ha_UnreachableInputs, { locale?: "en" | "pl" }, {}>;
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Admin_Auth_Ha_UnreachableInputs = {};
