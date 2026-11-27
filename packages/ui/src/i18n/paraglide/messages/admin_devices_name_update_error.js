/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Devices_Name_Update_ErrorInputs */



/**
* | output |
* | --- |
* | "Unable to update device name." |
*
* @param {Admin_Devices_Name_Update_ErrorInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_devices_name_update_error = /** @type {((inputs?: Admin_Devices_Name_Update_ErrorInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Devices_Name_Update_ErrorInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Nie udało się zaktualizować nazwy urządzenia.")
	return /** @type {LocalizedString} */ ("Unable to update device name.")
});