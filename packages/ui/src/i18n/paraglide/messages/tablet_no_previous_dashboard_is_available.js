/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_No_Previous_Dashboard_Is_AvailableInputs */



/**
* | output |
* | --- |
* | "No previous dashboard is available." |
*
* @param {Tablet_No_Previous_Dashboard_Is_AvailableInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_no_previous_dashboard_is_available = /** @type {((inputs?: Tablet_No_Previous_Dashboard_Is_AvailableInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_No_Previous_Dashboard_Is_AvailableInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Brak poprzedniego pulpitu.")
	return /** @type {LocalizedString} */ ("No previous dashboard is available.")
});