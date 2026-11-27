/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ domain: NonNullable<unknown> }} Admin_Entity_Search_EntitiesInputs */



/**
* | output |
* | --- |
* | "Search {domain} entities" |
*
* @param {Admin_Entity_Search_EntitiesInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_entity_search_entities = /** @type {((inputs: Admin_Entity_Search_EntitiesInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Entity_Search_EntitiesInputs, { locale?: "en" | "pl" }, {}>} */ ((i, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ (`Szukaj encji (${i?.domain})`)
	return /** @type {LocalizedString} */ (`Search ${i?.domain} entities`)
});