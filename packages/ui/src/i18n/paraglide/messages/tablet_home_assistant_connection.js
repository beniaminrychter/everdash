/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Home_Assistant_ConnectionInputs */



/**
* | output |
* | --- |
* | "Home Assistant connection" |
*
* @param {Tablet_Home_Assistant_ConnectionInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_home_assistant_connection = /** @type {((inputs?: Tablet_Home_Assistant_ConnectionInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Home_Assistant_ConnectionInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Połączenie z Home Assistant")
	return /** @type {LocalizedString} */ ("Home Assistant connection")
});