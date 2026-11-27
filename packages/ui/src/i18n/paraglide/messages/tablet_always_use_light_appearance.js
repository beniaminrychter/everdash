/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Always_Use_Light_AppearanceInputs */



/**
* | output |
* | --- |
* | "Always use light appearance." |
*
* @param {Tablet_Always_Use_Light_AppearanceInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_always_use_light_appearance = /** @type {((inputs?: Tablet_Always_Use_Light_AppearanceInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Always_Use_Light_AppearanceInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Zawsze używaj jasnego wyglądu.")
	return /** @type {LocalizedString} */ ("Always use light appearance.")
});