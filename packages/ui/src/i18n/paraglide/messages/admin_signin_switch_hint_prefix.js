/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Signin_Switch_Hint_PrefixInputs */



/**
* | output |
* | --- |
* | "To use a different Home Assistant, sign in and choose Disconnect under Home Assistant. If you cannot sign in, reset the saved connection with" |
*
* @param {Admin_Signin_Switch_Hint_PrefixInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_signin_switch_hint_prefix = /** @type {((inputs?: Admin_Signin_Switch_Hint_PrefixInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Signin_Switch_Hint_PrefixInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Aby użyć innego Home Assistant, zaloguj się i wybierz Rozłącz w zakładce Home Assistant. Jeśli nie możesz się zalogować, zresetuj zapisane połączenie poleceniem")
	return /** @type {LocalizedString} */ ("To use a different Home Assistant, sign in and choose Disconnect under Home Assistant. If you cannot sign in, reset the saved connection with")
});