/**
* | output |
* | --- |
* | "{name} will lose access to the dashboard and will need a new registration code to sign in again." |
*
*/
export const admin_devices_remove_description: ((inputs: Admin_Devices_Remove_DescriptionInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import("../runtime.js").MessageMetadata<Admin_Devices_Remove_DescriptionInputs, { locale?: "en" | "pl" }, {}>;
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Admin_Devices_Remove_DescriptionInputs = { name: NonNullable<unknown> };
