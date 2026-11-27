/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Unpair_This_TabletInputs */



/**
* | output |
* | --- |
* | "Unpair this tablet" |
*
* @param {Tablet_Unpair_This_TabletInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_unpair_this_tablet = /** @type {((inputs?: Tablet_Unpair_This_TabletInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Unpair_This_TabletInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Rozłącz ten tablet")
	return /** @type {LocalizedString} */ ("Unpair this tablet")
});