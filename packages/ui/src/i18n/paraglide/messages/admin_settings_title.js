/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Settings_TitleInputs */



/**
* | output |
* | --- |
* | "Tablet settings" |
*
* @param {Admin_Settings_TitleInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_settings_title = /** @type {((inputs?: Admin_Settings_TitleInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Settings_TitleInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Ustawienia tabletów")
	return /** @type {LocalizedString} */ ("Tablet settings")
});