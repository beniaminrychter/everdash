/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Pair_This_TabletInputs */



/**
* | output |
* | --- |
* | "Pair this tablet" |
*
* @param {Tablet_Pair_This_TabletInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_pair_this_tablet = /** @type {((inputs?: Tablet_Pair_This_TabletInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Pair_This_TabletInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Sparuj ten tablet")
	return /** @type {LocalizedString} */ ("Pair this tablet")
});