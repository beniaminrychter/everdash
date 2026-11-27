/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Invalid_Home_Assistant_ConfigurationInputs */



/**
* | output |
* | --- |
* | "Invalid Home Assistant configuration." |
*
* @param {Tablet_Invalid_Home_Assistant_ConfigurationInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_invalid_home_assistant_configuration = /** @type {((inputs?: Tablet_Invalid_Home_Assistant_ConfigurationInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Invalid_Home_Assistant_ConfigurationInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Nieprawidłowa konfiguracja Home Assistant.")
	return /** @type {LocalizedString} */ ("Invalid Home Assistant configuration.")
});