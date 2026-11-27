/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Set_Up_EverdashInputs */



/**
* | output |
* | --- |
* | "Set up EverDash" |
*
* @param {Tablet_Set_Up_EverdashInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_set_up_everdash = /** @type {((inputs?: Tablet_Set_Up_EverdashInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Set_Up_EverdashInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Skonfiguruj EverDash")
	return /** @type {LocalizedString} */ ("Set up EverDash")
});