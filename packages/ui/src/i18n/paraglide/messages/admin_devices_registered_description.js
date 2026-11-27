/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Devices_Registered_DescriptionInputs */



/**
* | output |
* | --- |
* | "Devices allowed to open this dashboard. Reloading a registered device keeps it signed in until removed." |
*
* @param {Admin_Devices_Registered_DescriptionInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_devices_registered_description = /** @type {((inputs?: Admin_Devices_Registered_DescriptionInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Devices_Registered_DescriptionInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Urządzenia uprawnione do otwierania tego pulpitu. Przeładowanie zarejestrowanego urządzenia utrzymuje sesję do momentu jego usunięcia.")
	return /** @type {LocalizedString} */ ("Devices allowed to open this dashboard. Reloading a registered device keeps it signed in until removed.")
});