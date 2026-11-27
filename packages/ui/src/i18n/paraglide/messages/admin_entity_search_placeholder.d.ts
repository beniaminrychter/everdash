/**
* | output |
* | --- |
* | "Search {domain} by name or ID" |
*
*/
export const admin_entity_search_placeholder: ((inputs: Admin_Entity_Search_PlaceholderInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import("../runtime.js").MessageMetadata<Admin_Entity_Search_PlaceholderInputs, { locale?: "en" | "pl" }, {}>;
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Admin_Entity_Search_PlaceholderInputs = { domain: NonNullable<unknown> };
