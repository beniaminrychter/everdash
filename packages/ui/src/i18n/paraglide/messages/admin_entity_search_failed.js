/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Entity_Search_FailedInputs */



/**
* | output |
* | --- |
* | "Entity search failed." |
*
* @param {Admin_Entity_Search_FailedInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_entity_search_failed = /** @type {((inputs?: Admin_Entity_Search_FailedInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Entity_Search_FailedInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Wyszukiwanie encji nie powiodło się.")
	return /** @type {LocalizedString} */ ("Entity search failed.")
});