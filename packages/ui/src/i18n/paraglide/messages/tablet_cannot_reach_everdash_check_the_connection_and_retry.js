/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Cannot_Reach_Everdash_Check_The_Connection_And_RetryInputs */



/**
* | output |
* | --- |
* | "Cannot reach EverDash. Check the connection and retry." |
*
* @param {Tablet_Cannot_Reach_Everdash_Check_The_Connection_And_RetryInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_cannot_reach_everdash_check_the_connection_and_retry = /** @type {((inputs?: Tablet_Cannot_Reach_Everdash_Check_The_Connection_And_RetryInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Cannot_Reach_Everdash_Check_The_Connection_And_RetryInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Nie można połączyć się z EverDash. Sprawdź połączenie i spróbuj ponownie.")
	return /** @type {LocalizedString} */ ("Cannot reach EverDash. Check the connection and retry.")
});