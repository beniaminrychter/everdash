/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Signin_Switch_Hint_MiddleInputs */



/**
* | output |
* | --- |
* | "(or" |
*
* @param {Admin_Signin_Switch_Hint_MiddleInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_signin_switch_hint_middle = /** @type {((inputs?: Admin_Signin_Switch_Hint_MiddleInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Signin_Switch_Hint_MiddleInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("(lub")
	return /** @type {LocalizedString} */ ("(or")
});