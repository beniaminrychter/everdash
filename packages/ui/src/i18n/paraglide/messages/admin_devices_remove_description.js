/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ name: NonNullable<unknown> }} Admin_Devices_Remove_DescriptionInputs */



/**
* | output |
* | --- |
* | "{name} will lose access to the dashboard and will need a new registration code to sign in again." |
*
* @param {Admin_Devices_Remove_DescriptionInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_devices_remove_description = /** @type {((inputs: Admin_Devices_Remove_DescriptionInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Devices_Remove_DescriptionInputs, { locale?: "en" | "pl" }, {}>} */ ((i, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ (`Urządzenie ${i?.name} utraci dostęp do pulpitu i będzie wymagać nowego kodu rejestracji przy kolejnym logowaniu.`)
	return /** @type {LocalizedString} */ (`${i?.name} will lose access to the dashboard and will need a new registration code to sign in again.`)
});