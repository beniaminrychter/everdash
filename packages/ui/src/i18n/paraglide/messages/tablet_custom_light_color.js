/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Custom_Light_ColorInputs */



/**
* | output |
* | --- |
* | "Custom light color" |
*
* @param {Tablet_Custom_Light_ColorInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_custom_light_color = /** @type {((inputs?: Tablet_Custom_Light_ColorInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Custom_Light_ColorInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Własny kolor światła")
	return /** @type {LocalizedString} */ ("Custom light color")
});