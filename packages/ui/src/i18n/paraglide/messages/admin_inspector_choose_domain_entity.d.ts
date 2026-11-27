/**
* | output |
* | --- |
* | "Choose a {domains} entity." |
*
*/
export const admin_inspector_choose_domain_entity: ((inputs: Admin_Inspector_Choose_Domain_EntityInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import("../runtime.js").MessageMetadata<Admin_Inspector_Choose_Domain_EntityInputs, { locale?: "en" | "pl" }, {}>;
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Admin_Inspector_Choose_Domain_EntityInputs = { domains: NonNullable<unknown> };
