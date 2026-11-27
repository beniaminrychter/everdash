/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Signin_Discovered_AriaInputs */



/**
* | output |
* | --- |
* | "Discovered Home Assistant instances" |
*
* @param {Admin_Signin_Discovered_AriaInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_signin_discovered_aria = /** @type {((inputs?: Admin_Signin_Discovered_AriaInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Signin_Discovered_AriaInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Wykryte instancje Home Assistant")
	return /** @type {LocalizedString} */ ("Discovered Home Assistant instances")
});