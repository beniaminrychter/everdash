/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Settings_DescriptionInputs */



/**
* | output |
* | --- |
* | "These settings apply to every tablet. Changes join the draft and go live when you save." |
*
* @param {Admin_Settings_DescriptionInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_settings_description = /** @type {((inputs?: Admin_Settings_DescriptionInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Settings_DescriptionInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Te ustawienia dotyczą każdego tabletu. Zmiany trafiają do wersji roboczej i zaczną obowiązywać po zapisaniu.")
	return /** @type {LocalizedString} */ ("These settings apply to every tablet. Changes join the draft and go live when you save.")
});