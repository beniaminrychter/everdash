/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Inspector_Pstryk_UsageInputs */



/**
* | output |
* | --- |
* | "Usage sensor" |
*
* @param {Admin_Inspector_Pstryk_UsageInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_inspector_pstryk_usage = /** @type {((inputs?: Admin_Inspector_Pstryk_UsageInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Inspector_Pstryk_UsageInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Czujnik zużycia")
	return /** @type {LocalizedString} */ ("Usage sensor")
});