/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_No_Server_ConfiguredInputs */



/**
* | output |
* | --- |
* | "No server configured" |
*
* @param {Tablet_No_Server_ConfiguredInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_no_server_configured = /** @type {((inputs?: Tablet_No_Server_ConfiguredInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_No_Server_ConfiguredInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Nie skonfigurowano serwera")
	return /** @type {LocalizedString} */ ("No server configured")
});