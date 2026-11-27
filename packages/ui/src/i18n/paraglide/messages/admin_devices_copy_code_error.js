/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Devices_Copy_Code_ErrorInputs */



/**
* | output |
* | --- |
* | "Unable to copy the registration code." |
*
* @param {Admin_Devices_Copy_Code_ErrorInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_devices_copy_code_error = /** @type {((inputs?: Admin_Devices_Copy_Code_ErrorInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Devices_Copy_Code_ErrorInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Nie udało się skopiować kodu rejestracji.")
	return /** @type {LocalizedString} */ ("Unable to copy the registration code.")
});