/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Tap_Add_Your_Home_Is_One_Tap_AwayInputs */



/**
* | output |
* | --- |
* | "Tap Add. Your home is one tap away." |
*
* @param {Tablet_Tap_Add_Your_Home_Is_One_Tap_AwayInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_tap_add_your_home_is_one_tap_away = /** @type {((inputs?: Tablet_Tap_Add_Your_Home_Is_One_Tap_AwayInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Tap_Add_Your_Home_Is_One_Tap_AwayInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Stuknij Dodaj. Pulpit będzie dostępny jednym dotknięciem.")
	return /** @type {LocalizedString} */ ("Tap Add. Your home is one tap away.")
});