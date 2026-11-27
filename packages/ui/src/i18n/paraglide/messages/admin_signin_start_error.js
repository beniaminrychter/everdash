/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Signin_Start_ErrorInputs */



/**
* | output |
* | --- |
* | "Could not start login." |
*
* @param {Admin_Signin_Start_ErrorInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_signin_start_error = /** @type {((inputs?: Admin_Signin_Start_ErrorInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Signin_Start_ErrorInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Nie udało się rozpocząć logowania.")
	return /** @type {LocalizedString} */ ("Could not start login.")
});