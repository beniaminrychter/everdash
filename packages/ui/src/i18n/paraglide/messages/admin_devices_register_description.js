/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Devices_Register_DescriptionInputs */



/**
* | output |
* | --- |
* | "Open the dashboard on a tablet or phone and enter this single-use registration code. A new code is generated automatically after each device registers." |
*
* @param {Admin_Devices_Register_DescriptionInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_devices_register_description = /** @type {((inputs?: Admin_Devices_Register_DescriptionInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Devices_Register_DescriptionInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Otwórz pulpit na tablecie lub telefonie i wpisz ten jednorazowy kod rejestracji. Po rejestracji każdego urządzenia automatycznie generowany jest nowy kod.")
	return /** @type {LocalizedString} */ ("Open the dashboard on a tablet or phone and enter this single-use registration code. A new code is generated automatically after each device registers.")
});