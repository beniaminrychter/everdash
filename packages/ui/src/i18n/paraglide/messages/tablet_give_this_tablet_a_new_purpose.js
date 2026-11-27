/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Give_This_Tablet_A_New_PurposeInputs */



/**
* | output |
* | --- |
* | "Give this tablet a new purpose." |
*
* @param {Tablet_Give_This_Tablet_A_New_PurposeInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_give_this_tablet_a_new_purpose = /** @type {((inputs?: Tablet_Give_This_Tablet_A_New_PurposeInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Give_This_Tablet_A_New_PurposeInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Nadaj temu tabletowi nowe życie.")
	return /** @type {LocalizedString} */ ("Give this tablet a new purpose.")
});