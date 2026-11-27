/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Settings_DescriptionInputs */



/**
* | output |
* | --- |
* | "Settings apply to all tablets when saved." |
*
* @param {Admin_Settings_DescriptionInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_settings_description = /** @type {((inputs?: Admin_Settings_DescriptionInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Settings_DescriptionInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Ustawienia zaczną obowiązywać na wszystkich tabletach po zapisaniu.")
	return /** @type {LocalizedString} */ ("Settings apply to all tablets when saved.")
});