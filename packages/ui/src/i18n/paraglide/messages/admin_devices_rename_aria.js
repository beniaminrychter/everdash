/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ name: NonNullable<unknown> }} Admin_Devices_Rename_AriaInputs */



/**
* | output |
* | --- |
* | "Rename {name}" |
*
* @param {Admin_Devices_Rename_AriaInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_devices_rename_aria = /** @type {((inputs: Admin_Devices_Rename_AriaInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Devices_Rename_AriaInputs, { locale?: "en" | "pl" }, {}>} */ ((i, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ (`Zmień nazwę ${i?.name}`)
	return /** @type {LocalizedString} */ (`Rename ${i?.name}`)
});