/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Connected_Through_EverdashInputs */



/**
* | output |
* | --- |
* | "Connected through EverDash" |
*
* @param {Tablet_Connected_Through_EverdashInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_connected_through_everdash = /** @type {((inputs?: Tablet_Connected_Through_EverdashInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Connected_Through_EverdashInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Połączono przez EverDash")
	return /** @type {LocalizedString} */ ("Connected through EverDash")
});