/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Configuration_Could_Not_Be_LoadedInputs */



/**
* | output |
* | --- |
* | "Configuration could not be loaded." |
*
* @param {Tablet_Configuration_Could_Not_Be_LoadedInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_configuration_could_not_be_loaded = /** @type {((inputs?: Tablet_Configuration_Could_Not_Be_LoadedInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Configuration_Could_Not_Be_LoadedInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Nie udało się wczytać konfiguracji.")
	return /** @type {LocalizedString} */ ("Configuration could not be loaded.")
});