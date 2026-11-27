/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Previous_Load_ErrorInputs */



/**
* | output |
* | --- |
* | "Previous dashboard could not be loaded." |
*
* @param {Admin_Previous_Load_ErrorInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_previous_load_error = /** @type {((inputs?: Admin_Previous_Load_ErrorInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Previous_Load_ErrorInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Nie udało się wczytać poprzedniego pulpitu.")
	return /** @type {LocalizedString} */ ("Previous dashboard could not be loaded.")
});