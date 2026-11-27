/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Ha_Connection_DescriptionInputs */



/**
* | output |
* | --- |
* | "EverDash talks to this Home Assistant on behalf of every tablet." |
*
* @param {Admin_Ha_Connection_DescriptionInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_ha_connection_description = /** @type {((inputs?: Admin_Ha_Connection_DescriptionInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Ha_Connection_DescriptionInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("EverDash komunikuje się z tą instancją Home Assistant w imieniu każdego tabletu.")
	return /** @type {LocalizedString} */ ("EverDash talks to this Home Assistant on behalf of every tablet.")
});