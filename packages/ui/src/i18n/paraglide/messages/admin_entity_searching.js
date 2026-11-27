/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Entity_SearchingInputs */



/**
* | output |
* | --- |
* | "Searching Home Assistant…" |
*
* @param {Admin_Entity_SearchingInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_entity_searching = /** @type {((inputs?: Admin_Entity_SearchingInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Entity_SearchingInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Przeszukiwanie Home Assistant…")
	return /** @type {LocalizedString} */ ("Searching Home Assistant…")
});