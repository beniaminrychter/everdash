/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Card_Kind_Weather_DescInputs */



/**
* | output |
* | --- |
* | "Current conditions and forecast" |
*
* @param {Admin_Card_Kind_Weather_DescInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_card_kind_weather_desc = /** @type {((inputs?: Admin_Card_Kind_Weather_DescInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Card_Kind_Weather_DescInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Bieżące warunki i prognoza")
	return /** @type {LocalizedString} */ ("Current conditions and forecast")
});