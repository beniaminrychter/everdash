/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Everdash_Could_Not_Be_Reached_Check_The_Connection_And_RetryInputs */



/**
* | output |
* | --- |
* | "EverDash could not be reached. Check the connection and retry." |
*
* @param {Tablet_Everdash_Could_Not_Be_Reached_Check_The_Connection_And_RetryInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_everdash_could_not_be_reached_check_the_connection_and_retry = /** @type {((inputs?: Tablet_Everdash_Could_Not_Be_Reached_Check_The_Connection_And_RetryInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Everdash_Could_Not_Be_Reached_Check_The_Connection_And_RetryInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Nie można połączyć się z EverDash. Sprawdź połączenie i spróbuj ponownie.")
	return /** @type {LocalizedString} */ ("EverDash could not be reached. Check the connection and retry.")
});