/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Signin_ConnectingInputs */



/**
* | output |
* | --- |
* | "Connecting…" |
*
* @param {Admin_Signin_ConnectingInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_signin_connecting = /** @type {((inputs?: Admin_Signin_ConnectingInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Signin_ConnectingInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Łączenie…")
	return /** @type {LocalizedString} */ ("Connecting…")
});