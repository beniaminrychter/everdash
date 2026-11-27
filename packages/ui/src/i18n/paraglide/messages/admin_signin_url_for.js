/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ name: NonNullable<unknown> }} Admin_Signin_Url_ForInputs */



/**
* | output |
* | --- |
* | "URL for {name}" |
*
* @param {Admin_Signin_Url_ForInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_signin_url_for = /** @type {((inputs: Admin_Signin_Url_ForInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Signin_Url_ForInputs, { locale?: "en" | "pl" }, {}>} */ ((i, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ (`Adres URL dla ${i?.name}`)
	return /** @type {LocalizedString} */ (`URL for ${i?.name}`)
});