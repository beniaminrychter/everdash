/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Card_Kind_Pstryk_DescInputs */



/**
* | output |
* | --- |
* | "Energy prices and usage" |
*
* @param {Admin_Card_Kind_Pstryk_DescInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_card_kind_pstryk_desc = /** @type {((inputs?: Admin_Card_Kind_Pstryk_DescInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Card_Kind_Pstryk_DescInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Ceny i zużycie energii")
	return /** @type {LocalizedString} */ ("Energy prices and usage")
});