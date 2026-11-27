/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Code_Expires_In_Five_MinutesInputs */



/**
* | output |
* | --- |
* | "Code expires in five minutes." |
*
* @param {Tablet_Code_Expires_In_Five_MinutesInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_code_expires_in_five_minutes = /** @type {((inputs?: Tablet_Code_Expires_In_Five_MinutesInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Code_Expires_In_Five_MinutesInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Kod wygaśnie za pięć minut.")
	return /** @type {LocalizedString} */ ("Code expires in five minutes.")
});