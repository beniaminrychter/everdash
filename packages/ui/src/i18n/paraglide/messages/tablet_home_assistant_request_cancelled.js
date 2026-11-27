/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Home_Assistant_Request_CancelledInputs */



/**
* | output |
* | --- |
* | "Home Assistant request cancelled." |
*
* @param {Tablet_Home_Assistant_Request_CancelledInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_home_assistant_request_cancelled = /** @type {((inputs?: Tablet_Home_Assistant_Request_CancelledInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Home_Assistant_Request_CancelledInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Anulowano zapytanie do Home Assistant.")
	return /** @type {LocalizedString} */ ("Home Assistant request cancelled.")
});