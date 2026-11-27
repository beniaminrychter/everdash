/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Inspector_Decimal_PlacesInputs */



/**
* | output |
* | --- |
* | "Decimal places" |
*
* @param {Admin_Inspector_Decimal_PlacesInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_inspector_decimal_places = /** @type {((inputs?: Admin_Inspector_Decimal_PlacesInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Inspector_Decimal_PlacesInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Miejsca po przecinku")
	return /** @type {LocalizedString} */ ("Decimal places")
});