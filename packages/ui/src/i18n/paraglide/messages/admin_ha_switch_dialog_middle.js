/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Ha_Switch_Dialog_MiddleInputs */



/**
* | output |
* | --- |
* | "and open sign-in for" |
*
* @param {Admin_Ha_Switch_Dialog_MiddleInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_ha_switch_dialog_middle = /** @type {((inputs?: Admin_Ha_Switch_Dialog_MiddleInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Ha_Switch_Dialog_MiddleInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("i otworzy logowanie do")
	return /** @type {LocalizedString} */ ("and open sign-in for")
});