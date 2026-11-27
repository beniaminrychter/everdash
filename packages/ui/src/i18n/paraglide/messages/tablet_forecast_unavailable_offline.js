/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Forecast_Unavailable_OfflineInputs */



/**
* | output |
* | --- |
* | "Forecast unavailable offline" |
*
* @param {Tablet_Forecast_Unavailable_OfflineInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_forecast_unavailable_offline = /** @type {((inputs?: Tablet_Forecast_Unavailable_OfflineInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Forecast_Unavailable_OfflineInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Prognoza niedostępna bez połączenia")
	return /** @type {LocalizedString} */ ("Forecast unavailable offline")
});