/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Entity_Not_Found_HaInputs */



/**
* | output |
* | --- |
* | "Not found in Home Assistant. The saved ID stays unchanged." |
*
* @param {Admin_Entity_Not_Found_HaInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_entity_not_found_ha = /** @type {((inputs?: Admin_Entity_Not_Found_HaInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Entity_Not_Found_HaInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Nie znaleziono w Home Assistant. Zapisany identyfikator pozostanie bez zmian.")
	return /** @type {LocalizedString} */ ("Not found in Home Assistant. The saved ID stays unchanged.")
});