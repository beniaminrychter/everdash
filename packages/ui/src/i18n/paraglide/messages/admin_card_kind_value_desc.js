/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Card_Kind_Value_DescInputs */



/**
* | output |
* | --- |
* | "Show a sensor or number" |
*
* @param {Admin_Card_Kind_Value_DescInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_card_kind_value_desc = /** @type {((inputs?: Admin_Card_Kind_Value_DescInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Card_Kind_Value_DescInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Wyświetl czujnik lub liczbę")
	return /** @type {LocalizedString} */ ("Show a sensor or number")
});