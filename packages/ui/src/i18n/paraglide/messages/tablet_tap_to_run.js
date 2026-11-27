/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Tap_To_RunInputs */



/**
* | output |
* | --- |
* | "Tap to run" |
*
* @param {Tablet_Tap_To_RunInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_tap_to_run = /** @type {((inputs?: Tablet_Tap_To_RunInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Tap_To_RunInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Dotknij, aby uruchomić")
	return /** @type {LocalizedString} */ ("Tap to run")
});