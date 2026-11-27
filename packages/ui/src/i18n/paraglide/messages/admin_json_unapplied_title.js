/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Json_Unapplied_TitleInputs */



/**
* | output |
* | --- |
* | "Unapplied JSON changes" |
*
* @param {Admin_Json_Unapplied_TitleInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_json_unapplied_title = /** @type {((inputs?: Admin_Json_Unapplied_TitleInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Json_Unapplied_TitleInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Niezastosowane zmiany JSON")
	return /** @type {LocalizedString} */ ("Unapplied JSON changes")
});