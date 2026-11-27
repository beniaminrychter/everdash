/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Devices_Name_PlaceholderInputs */



/**
* | output |
* | --- |
* | "Living room iPad" |
*
* @param {Admin_Devices_Name_PlaceholderInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_devices_name_placeholder = /** @type {((inputs?: Admin_Devices_Name_PlaceholderInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Devices_Name_PlaceholderInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("iPad w salonie")
	return /** @type {LocalizedString} */ ("Living room iPad")
});