/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_More_Save_OptionsInputs */



/**
* | output |
* | --- |
* | "More save options" |
*
* @param {Admin_More_Save_OptionsInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_more_save_options = /** @type {((inputs?: Admin_More_Save_OptionsInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_More_Save_OptionsInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Więcej opcji zapisu")
	return /** @type {LocalizedString} */ ("More save options")
});