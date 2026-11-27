/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Ha_Discovery_DescriptionInputs */



/**
* | output |
* | --- |
* | "Automatically scans your home network for Home Assistant instances." |
*
* @param {Admin_Ha_Discovery_DescriptionInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_ha_discovery_description = /** @type {((inputs?: Admin_Ha_Discovery_DescriptionInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Ha_Discovery_DescriptionInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Automatycznie skanuje sieć domową w poszukiwaniu instancji Home Assistant.")
	return /** @type {LocalizedString} */ ("Automatically scans your home network for Home Assistant instances.")
});