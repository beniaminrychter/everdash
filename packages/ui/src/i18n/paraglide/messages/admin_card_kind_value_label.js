/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Card_Kind_Value_LabelInputs */



/**
* | output |
* | --- |
* | "Value" |
*
* @param {Admin_Card_Kind_Value_LabelInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_card_kind_value_label = /** @type {((inputs?: Admin_Card_Kind_Value_LabelInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Card_Kind_Value_LabelInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Wartość")
	return /** @type {LocalizedString} */ ("Value")
});