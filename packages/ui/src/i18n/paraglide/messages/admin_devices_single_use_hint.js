/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Devices_Single_Use_HintInputs */



/**
* | output |
* | --- |
* | "Single-use code. Automatically regenerates once a device registers." |
*
* @param {Admin_Devices_Single_Use_HintInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_devices_single_use_hint = /** @type {((inputs?: Admin_Devices_Single_Use_HintInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Devices_Single_Use_HintInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Kod jednorazowy. Generuje się automatycznie po rejestracji urządzenia.")
	return /** @type {LocalizedString} */ ("Single-use code. Automatically regenerates once a device registers.")
});