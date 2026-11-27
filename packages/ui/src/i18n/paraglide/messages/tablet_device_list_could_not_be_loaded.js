/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Device_List_Could_Not_Be_LoadedInputs */



/**
* | output |
* | --- |
* | "Device list could not be loaded." |
*
* @param {Tablet_Device_List_Could_Not_Be_LoadedInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_device_list_could_not_be_loaded = /** @type {((inputs?: Tablet_Device_List_Could_Not_Be_LoadedInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Device_List_Could_Not_Be_LoadedInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Nie udało się wczytać listy urządzeń.")
	return /** @type {LocalizedString} */ ("Device list could not be loaded.")
});