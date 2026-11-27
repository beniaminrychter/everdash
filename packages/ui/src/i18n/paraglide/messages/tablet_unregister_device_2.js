/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Unregister_Device_2Inputs */



/**
* | output |
* | --- |
* | "Unregister device?" |
*
* @param {Tablet_Unregister_Device_2Inputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_unregister_device_2 = /** @type {((inputs?: Tablet_Unregister_Device_2Inputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Unregister_Device_2Inputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Wyrejestrować urządzenie?")
	return /** @type {LocalizedString} */ ("Unregister device?")
});