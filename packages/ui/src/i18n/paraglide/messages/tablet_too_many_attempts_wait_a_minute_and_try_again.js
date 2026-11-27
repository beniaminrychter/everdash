/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Too_Many_Attempts_Wait_A_Minute_And_Try_AgainInputs */



/**
* | output |
* | --- |
* | "Too many attempts. Wait a minute and try again." |
*
* @param {Tablet_Too_Many_Attempts_Wait_A_Minute_And_Try_AgainInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_too_many_attempts_wait_a_minute_and_try_again = /** @type {((inputs?: Tablet_Too_Many_Attempts_Wait_A_Minute_And_Try_AgainInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Too_Many_Attempts_Wait_A_Minute_And_Try_AgainInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Zbyt wiele prób. Odczekaj minutę i spróbuj ponownie.")
	return /** @type {LocalizedString} */ ("Too many attempts. Wait a minute and try again.")
});