/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ name: NonNullable<unknown> }} Admin_Devices_Remove_AriaInputs */



/**
* | output |
* | --- |
* | "Remove {name}" |
*
* @param {Admin_Devices_Remove_AriaInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_devices_remove_aria = /** @type {((inputs: Admin_Devices_Remove_AriaInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Devices_Remove_AriaInputs, { locale?: "en" | "pl" }, {}>} */ ((i, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ (`Usuń ${i?.name}`)
	return /** @type {LocalizedString} */ (`Remove ${i?.name}`)
});