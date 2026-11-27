/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Load_Settings_ErrorInputs */



/**
* | output |
* | --- |
* | "Dashboard settings could not be loaded." |
*
* @param {Admin_Load_Settings_ErrorInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_load_settings_error = /** @type {((inputs?: Admin_Load_Settings_ErrorInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Load_Settings_ErrorInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Nie udało się wczytać ustawień pulpitu.")
	return /** @type {LocalizedString} */ ("Dashboard settings could not be loaded.")
});