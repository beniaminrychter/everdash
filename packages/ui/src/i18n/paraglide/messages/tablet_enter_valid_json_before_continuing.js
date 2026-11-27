/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Enter_Valid_Json_Before_ContinuingInputs */



/**
* | output |
* | --- |
* | "Enter valid JSON before continuing." |
*
* @param {Tablet_Enter_Valid_Json_Before_ContinuingInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_enter_valid_json_before_continuing = /** @type {((inputs?: Tablet_Enter_Valid_Json_Before_ContinuingInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Enter_Valid_Json_Before_ContinuingInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Wpisz prawidłowy JSON, aby kontynuować.")
	return /** @type {LocalizedString} */ ("Enter valid JSON before continuing.")
});