/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Card_Kind_Toggle_DescInputs */



/**
* | output |
* | --- |
* | "Toggle or show on/off" |
*
* @param {Admin_Card_Kind_Toggle_DescInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_card_kind_toggle_desc = /** @type {((inputs?: Admin_Card_Kind_Toggle_DescInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Card_Kind_Toggle_DescInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Przełączaj lub pokazuj stan wł./wył.")
	return /** @type {LocalizedString} */ ("Toggle or show on/off")
});