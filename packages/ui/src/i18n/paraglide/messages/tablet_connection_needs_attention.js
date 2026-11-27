/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Connection_Needs_AttentionInputs */



/**
* | output |
* | --- |
* | "Connection needs attention" |
*
* @param {Tablet_Connection_Needs_AttentionInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_connection_needs_attention = /** @type {((inputs?: Tablet_Connection_Needs_AttentionInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Connection_Needs_AttentionInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Problem z połączeniem")
	return /** @type {LocalizedString} */ ("Connection needs attention")
});