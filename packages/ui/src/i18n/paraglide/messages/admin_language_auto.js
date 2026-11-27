/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Language_AutoInputs */



/**
* | output |
* | --- |
* | "Auto (Home Assistant)" |
*
* @param {Admin_Language_AutoInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_language_auto = /** @type {((inputs?: Admin_Language_AutoInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Language_AutoInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Auto (Home Assistant)")
	return /** @type {LocalizedString} */ ("Auto (Home Assistant)")
});