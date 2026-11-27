/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Everdash_Could_Not_Connect_To_Home_AssistantInputs */



/**
* | output |
* | --- |
* | "EverDash could not connect to Home Assistant." |
*
* @param {Tablet_Everdash_Could_Not_Connect_To_Home_AssistantInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_everdash_could_not_connect_to_home_assistant = /** @type {((inputs?: Tablet_Everdash_Could_Not_Connect_To_Home_AssistantInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Everdash_Could_Not_Connect_To_Home_AssistantInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("EverDash nie może połączyć się z Home Assistant.")
	return /** @type {LocalizedString} */ ("EverDash could not connect to Home Assistant.")
});