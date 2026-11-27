/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Inspector_Pstryk_Next_PriceInputs */



/**
* | output |
* | --- |
* | "Next price sensor" |
*
* @param {Admin_Inspector_Pstryk_Next_PriceInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_inspector_pstryk_next_price = /** @type {((inputs?: Admin_Inspector_Pstryk_Next_PriceInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Inspector_Pstryk_Next_PriceInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Czujnik ceny na następną godzinę")
	return /** @type {LocalizedString} */ ("Next price sensor")
});