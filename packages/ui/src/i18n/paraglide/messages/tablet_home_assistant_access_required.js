/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Home_Assistant_Access_RequiredInputs */



/**
* | output |
* | --- |
* | "Home Assistant access required" |
*
* @param {Tablet_Home_Assistant_Access_RequiredInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_home_assistant_access_required = /** @type {((inputs?: Tablet_Home_Assistant_Access_RequiredInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Home_Assistant_Access_RequiredInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Wymagany dostęp do Home Assistant")
	return /** @type {LocalizedString} */ ("Home Assistant access required")
});