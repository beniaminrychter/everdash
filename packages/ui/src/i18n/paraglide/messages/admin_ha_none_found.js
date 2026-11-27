/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Ha_None_FoundInputs */



/**
* | output |
* | --- |
* | "No Home Assistant instances were found on this network." |
*
* @param {Admin_Ha_None_FoundInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_ha_none_found = /** @type {((inputs?: Admin_Ha_None_FoundInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Ha_None_FoundInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Nie znaleziono żadnych instancji Home Assistant w tej sieci.")
	return /** @type {LocalizedString} */ ("No Home Assistant instances were found on this network.")
});