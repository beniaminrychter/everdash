/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Connected_To_Home_AssistantInputs */



/**
* | output |
* | --- |
* | "Connected to Home Assistant" |
*
* @param {Tablet_Connected_To_Home_AssistantInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_connected_to_home_assistant = /** @type {((inputs?: Tablet_Connected_To_Home_AssistantInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Connected_To_Home_AssistantInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Połączono z Home Assistant")
	return /** @type {LocalizedString} */ ("Connected to Home Assistant")
});