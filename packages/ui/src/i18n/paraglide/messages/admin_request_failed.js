/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ status: NonNullable<unknown> }} Admin_Request_FailedInputs */



/**
* | output |
* | --- |
* | "EverDash request failed ({status})." |
*
* @param {Admin_Request_FailedInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_request_failed = /** @type {((inputs: Admin_Request_FailedInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Request_FailedInputs, { locale?: "en" | "pl" }, {}>} */ ((i, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ (`Żądanie do EverDash nie powiodło się (${i?.status}).`)
	return /** @type {LocalizedString} */ (`EverDash request failed (${i?.status}).`)
});