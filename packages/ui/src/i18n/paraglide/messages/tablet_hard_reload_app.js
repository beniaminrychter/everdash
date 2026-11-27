/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Hard_Reload_AppInputs */



/**
* | output |
* | --- |
* | "Hard reload app" |
*
* @param {Tablet_Hard_Reload_AppInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_hard_reload_app = /** @type {((inputs?: Tablet_Hard_Reload_AppInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Hard_Reload_AppInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Przeładuj aplikację")
	return /** @type {LocalizedString} */ ("Hard reload app")
});