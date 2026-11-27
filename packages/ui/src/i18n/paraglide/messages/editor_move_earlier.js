/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Editor_Move_EarlierInputs */



/**
* | output |
* | --- |
* | "Move earlier" |
*
* @param {Editor_Move_EarlierInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const editor_move_earlier = /** @type {((inputs?: Editor_Move_EarlierInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Editor_Move_EarlierInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Przesuń wcześniej")
	return /** @type {LocalizedString} */ ("Move earlier")
});