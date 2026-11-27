/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Devices_Code_GeneratedInputs */



/**
* | output |
* | --- |
* | "New registration code generated." |
*
* @param {Admin_Devices_Code_GeneratedInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_devices_code_generated = /** @type {((inputs?: Admin_Devices_Code_GeneratedInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Devices_Code_GeneratedInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Wygenerowano nowy kod rejestracji.")
	return /** @type {LocalizedString} */ ("New registration code generated.")
});