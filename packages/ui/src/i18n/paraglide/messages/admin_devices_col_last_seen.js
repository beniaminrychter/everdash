/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Devices_Col_Last_SeenInputs */



/**
* | output |
* | --- |
* | "Last seen" |
*
* @param {Admin_Devices_Col_Last_SeenInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_devices_col_last_seen = /** @type {((inputs?: Admin_Devices_Col_Last_SeenInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Devices_Col_Last_SeenInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Ostatnio widziane")
	return /** @type {LocalizedString} */ ("Last seen")
});