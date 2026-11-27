/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Inspector_Clock_BothInputs */



/**
* | output |
* | --- |
* | "Both" |
*
* @param {Admin_Inspector_Clock_BothInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_inspector_clock_both = /** @type {((inputs?: Admin_Inspector_Clock_BothInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Inspector_Clock_BothInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Oba")
	return /** @type {LocalizedString} */ ("Both")
});