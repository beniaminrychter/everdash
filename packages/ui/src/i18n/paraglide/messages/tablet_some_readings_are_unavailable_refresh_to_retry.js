/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Some_Readings_Are_Unavailable_Refresh_To_RetryInputs */



/**
* | output |
* | --- |
* | "Some readings are unavailable. Refresh to retry." |
*
* @param {Tablet_Some_Readings_Are_Unavailable_Refresh_To_RetryInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_some_readings_are_unavailable_refresh_to_retry = /** @type {((inputs?: Tablet_Some_Readings_Are_Unavailable_Refresh_To_RetryInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Some_Readings_Are_Unavailable_Refresh_To_RetryInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Niektóre dane są niedostępne. Odśwież, aby spróbować ponownie.")
	return /** @type {LocalizedString} */ ("Some readings are unavailable. Refresh to retry.")
});