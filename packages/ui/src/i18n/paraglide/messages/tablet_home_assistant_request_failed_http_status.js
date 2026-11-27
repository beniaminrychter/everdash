/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ status: NonNullable<unknown> }} Tablet_Home_Assistant_Request_Failed_Http_StatusInputs */



/**
* | output |
* | --- |
* | "Home Assistant request failed (HTTP {status})." |
*
* @param {Tablet_Home_Assistant_Request_Failed_Http_StatusInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_home_assistant_request_failed_http_status = /** @type {((inputs: Tablet_Home_Assistant_Request_Failed_Http_StatusInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Home_Assistant_Request_Failed_Http_StatusInputs, { locale?: "en" | "pl" }, {}>} */ ((i, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ (`Błąd zapytania do Home Assistant (HTTP ${i?.status}).`)
	return /** @type {LocalizedString} */ (`Home Assistant request failed (HTTP ${i?.status}).`)
});