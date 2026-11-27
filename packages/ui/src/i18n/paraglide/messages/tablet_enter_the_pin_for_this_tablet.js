/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Enter_The_Pin_For_This_TabletInputs */



/**
* | output |
* | --- |
* | "Enter the PIN for this tablet." |
*
* @param {Tablet_Enter_The_Pin_For_This_TabletInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_enter_the_pin_for_this_tablet = /** @type {((inputs?: Tablet_Enter_The_Pin_For_This_TabletInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Enter_The_Pin_For_This_TabletInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Wpisz PIN tego tabletu.")
	return /** @type {LocalizedString} */ ("Enter the PIN for this tablet.")
});