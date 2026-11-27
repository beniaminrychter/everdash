/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Tap_Share_Then_Add_To_Home_ScreenInputs */



/**
* | output |
* | --- |
* | "Tap Share, then Add to Home Screen." |
*
* @param {Tablet_Tap_Share_Then_Add_To_Home_ScreenInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_tap_share_then_add_to_home_screen = /** @type {((inputs?: Tablet_Tap_Share_Then_Add_To_Home_ScreenInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Tap_Share_Then_Add_To_Home_ScreenInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Stuknij Udostępnij, a następnie Do ekranu początkowego.")
	return /** @type {LocalizedString} */ ("Tap Share, then Add to Home Screen.")
});