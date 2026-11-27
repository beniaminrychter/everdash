/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Devices_EmptyInputs */



/**
* | output |
* | --- |
* | "No devices registered yet. Open the dashboard address on your tablet or phone and enter the registration code above." |
*
* @param {Admin_Devices_EmptyInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_devices_empty = /** @type {((inputs?: Admin_Devices_EmptyInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Devices_EmptyInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Brak zarejestrowanych urządzeń. Otwórz adres pulpitu na tablecie lub telefonie i wpisz powyższy kod rejestracji.")
	return /** @type {LocalizedString} */ ("No devices registered yet. Open the dashboard address on your tablet or phone and enter the registration code above.")
});