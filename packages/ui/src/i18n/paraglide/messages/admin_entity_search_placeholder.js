/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ domain: NonNullable<unknown> }} Admin_Entity_Search_PlaceholderInputs */



/**
* | output |
* | --- |
* | "Search {domain} by name or ID" |
*
* @param {Admin_Entity_Search_PlaceholderInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_entity_search_placeholder = /** @type {((inputs: Admin_Entity_Search_PlaceholderInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Entity_Search_PlaceholderInputs, { locale?: "en" | "pl" }, {}>} */ ((i, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ (`Szukaj ${i?.domain} po nazwie lub ID`)
	return /** @type {LocalizedString} */ (`Search ${i?.domain} by name or ID`)
});