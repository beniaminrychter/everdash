/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Devices_Name_UpdatedInputs */



/**
* | output |
* | --- |
* | "Device name updated." |
*
* @param {Admin_Devices_Name_UpdatedInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_devices_name_updated = /** @type {((inputs?: Admin_Devices_Name_UpdatedInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Devices_Name_UpdatedInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Zaktualizowano nazwę urządzenia.")
	return /** @type {LocalizedString} */ ("Device name updated.")
});