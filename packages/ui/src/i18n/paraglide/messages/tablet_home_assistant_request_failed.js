/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Home_Assistant_Request_FailedInputs */



/**
* | output |
* | --- |
* | "Home Assistant request failed." |
*
* @param {Tablet_Home_Assistant_Request_FailedInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_home_assistant_request_failed = /** @type {((inputs?: Tablet_Home_Assistant_Request_FailedInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Home_Assistant_Request_FailedInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Błąd zapytania do Home Assistant.")
	return /** @type {LocalizedString} */ ("Home Assistant request failed.")
});