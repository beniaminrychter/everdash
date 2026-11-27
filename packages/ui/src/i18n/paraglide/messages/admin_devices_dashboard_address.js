/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Devices_Dashboard_AddressInputs */



/**
* | output |
* | --- |
* | "Dashboard address" |
*
* @param {Admin_Devices_Dashboard_AddressInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_devices_dashboard_address = /** @type {((inputs?: Admin_Devices_Dashboard_AddressInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Devices_Dashboard_AddressInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Adres pulpitu")
	return /** @type {LocalizedString} */ ("Dashboard address")
});