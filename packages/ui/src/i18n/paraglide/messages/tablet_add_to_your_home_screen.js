/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Add_To_Your_Home_ScreenInputs */



/**
* | output |
* | --- |
* | "Add to your Home Screen" |
*
* @param {Tablet_Add_To_Your_Home_ScreenInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_add_to_your_home_screen = /** @type {((inputs?: Tablet_Add_To_Your_Home_ScreenInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Add_To_Your_Home_ScreenInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Dodaj do ekranu początkowego")
	return /** @type {LocalizedString} */ ("Add to your Home Screen")
});