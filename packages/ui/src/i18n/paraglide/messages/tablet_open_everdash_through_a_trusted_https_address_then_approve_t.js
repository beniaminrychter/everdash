/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Open_Everdash_Through_A_Trusted_Https_Address_Then_Approve_TInputs */



/**
* | output |
* | --- |
* | "Open EverDash through a trusted HTTPS address, then approve this code in Home Assistant." |
*
* @param {Tablet_Open_Everdash_Through_A_Trusted_Https_Address_Then_Approve_TInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_open_everdash_through_a_trusted_https_address_then_approve_t = /** @type {((inputs?: Tablet_Open_Everdash_Through_A_Trusted_Https_Address_Then_Approve_TInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Open_Everdash_Through_A_Trusted_Https_Address_Then_Approve_TInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Otwórz EverDash przez zaufany adres HTTPS, a następnie zatwierdź ten kod w Home Assistant.")
	return /** @type {LocalizedString} */ ("Open EverDash through a trusted HTTPS address, then approve this code in Home Assistant.")
});