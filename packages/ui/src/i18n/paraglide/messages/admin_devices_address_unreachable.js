/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Devices_Address_UnreachableInputs */



/**
* | output |
* | --- |
* | "Not reachable" |
*
* @param {Admin_Devices_Address_UnreachableInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_devices_address_unreachable = /** @type {((inputs?: Admin_Devices_Address_UnreachableInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Devices_Address_UnreachableInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Niedostępny")
	return /** @type {LocalizedString} */ ("Not reachable")
});