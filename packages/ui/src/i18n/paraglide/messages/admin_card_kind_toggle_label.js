/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Card_Kind_Toggle_LabelInputs */



/**
* | output |
* | --- |
* | "Switch" |
*
* @param {Admin_Card_Kind_Toggle_LabelInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_card_kind_toggle_label = /** @type {((inputs?: Admin_Card_Kind_Toggle_LabelInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Card_Kind_Toggle_LabelInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Przełącznik")
	return /** @type {LocalizedString} */ ("Switch")
});