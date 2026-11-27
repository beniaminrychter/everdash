/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Hard_Reload_Failed_Please_RetryInputs */



/**
* | output |
* | --- |
* | "Hard reload failed. Please retry." |
*
* @param {Tablet_Hard_Reload_Failed_Please_RetryInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_hard_reload_failed_please_retry = /** @type {((inputs?: Tablet_Hard_Reload_Failed_Please_RetryInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Hard_Reload_Failed_Please_RetryInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Nie udało się przeładować aplikacji. Spróbuj ponownie.")
	return /** @type {LocalizedString} */ ("Hard reload failed. Please retry.")
});