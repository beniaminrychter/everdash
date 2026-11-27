/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Refresh_DevicesInputs */



/**
* | output |
* | --- |
* | "Refresh devices" |
*
* @param {Tablet_Refresh_DevicesInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_refresh_devices = /** @type {((inputs?: Tablet_Refresh_DevicesInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Refresh_DevicesInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Odśwież listę urządzeń")
	return /** @type {LocalizedString} */ ("Refresh devices")
});