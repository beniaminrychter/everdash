/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Offline_Prices_UnavailableInputs */



/**
* | output |
* | --- |
* | "Offline · prices unavailable" |
*
* @param {Tablet_Offline_Prices_UnavailableInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_offline_prices_unavailable = /** @type {((inputs?: Tablet_Offline_Prices_UnavailableInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Offline_Prices_UnavailableInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Brak sieci · ceny niedostępne")
	return /** @type {LocalizedString} */ ("Offline · prices unavailable")
});