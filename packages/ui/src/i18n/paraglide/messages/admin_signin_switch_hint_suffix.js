/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Signin_Switch_Hint_SuffixInputs */



/**
* | output |
* | --- |
* | "on the server)." |
*
* @param {Admin_Signin_Switch_Hint_SuffixInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_signin_switch_hint_suffix = /** @type {((inputs?: Admin_Signin_Switch_Hint_SuffixInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Signin_Switch_Hint_SuffixInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("na serwerze).")
	return /** @type {LocalizedString} */ ("on the server).")
});