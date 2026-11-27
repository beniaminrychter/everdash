/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Unregister_DeviceInputs */



/**
* | output |
* | --- |
* | "Unregister device" |
*
* @param {Tablet_Unregister_DeviceInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_unregister_device = /** @type {((inputs?: Tablet_Unregister_DeviceInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Unregister_DeviceInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Wyrejestruj urządzenie")
	return /** @type {LocalizedString} */ ("Unregister device")
});