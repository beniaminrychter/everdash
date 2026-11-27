/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Daily_Forecast_UnavailableInputs */



/**
* | output |
* | --- |
* | "Daily forecast unavailable" |
*
* @param {Tablet_Daily_Forecast_UnavailableInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_daily_forecast_unavailable = /** @type {((inputs?: Tablet_Daily_Forecast_UnavailableInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Daily_Forecast_UnavailableInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Prognoza dzienna niedostępna")
	return /** @type {LocalizedString} */ ("Daily forecast unavailable")
});