/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Starting_A_Secure_Pairing_RequestInputs */



/**
* | output |
* | --- |
* | "Starting a secure pairing request…" |
*
* @param {Tablet_Starting_A_Secure_Pairing_RequestInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_starting_a_secure_pairing_request = /** @type {((inputs?: Tablet_Starting_A_Secure_Pairing_RequestInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Starting_A_Secure_Pairing_RequestInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Rozpoczynanie bezpiecznego parowania…")
	return /** @type {LocalizedString} */ ("Starting a secure pairing request…")
});