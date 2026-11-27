/**
* | output |
* | --- |
* | "Search {domain} entities" |
*
*/
export const admin_entity_search_entities: ((inputs: Admin_Entity_Search_EntitiesInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import("../runtime.js").MessageMetadata<Admin_Entity_Search_EntitiesInputs, { locale?: "en" | "pl" }, {}>;
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Admin_Entity_Search_EntitiesInputs = { domain: NonNullable<unknown> };
