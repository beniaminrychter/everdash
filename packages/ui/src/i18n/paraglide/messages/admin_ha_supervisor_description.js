/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Ha_Supervisor_DescriptionInputs */



/**
* | output |
* | --- |
* | "EverDash talks to Home Assistant through the built-in app connection on behalf of every tablet." |
*
* @param {Admin_Ha_Supervisor_DescriptionInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_ha_supervisor_description = /** @type {((inputs?: Admin_Ha_Supervisor_DescriptionInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Ha_Supervisor_DescriptionInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("EverDash komunikuje się z Home Assistant przez wbudowane połączenie dodatku w imieniu każdego tabletu.")
	return /** @type {LocalizedString} */ ("EverDash talks to Home Assistant through the built-in app connection on behalf of every tablet.")
});