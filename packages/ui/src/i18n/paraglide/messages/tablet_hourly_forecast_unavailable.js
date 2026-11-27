/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Hourly_Forecast_UnavailableInputs */



/**
* | output |
* | --- |
* | "Hourly forecast unavailable" |
*
* @param {Tablet_Hourly_Forecast_UnavailableInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_hourly_forecast_unavailable = /** @type {((inputs?: Tablet_Hourly_Forecast_UnavailableInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Hourly_Forecast_UnavailableInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Prognoza godzinowa niedostępna")
	return /** @type {LocalizedString} */ ("Hourly forecast unavailable")
});