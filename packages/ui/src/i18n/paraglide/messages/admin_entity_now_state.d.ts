/**
* | output |
* | --- |
* | "Now {state}" |
*
*/
export const admin_entity_now_state: ((inputs: Admin_Entity_Now_StateInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import("../runtime.js").MessageMetadata<Admin_Entity_Now_StateInputs, { locale?: "en" | "pl" }, {}>;
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Admin_Entity_Now_StateInputs = { state: NonNullable<unknown> };
