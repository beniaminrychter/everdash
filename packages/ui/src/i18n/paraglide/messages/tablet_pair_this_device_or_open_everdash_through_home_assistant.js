/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Pair_This_Device_Or_Open_Everdash_Through_Home_AssistantInputs */



/**
* | output |
* | --- |
* | "Pair this device or open EverDash through Home Assistant." |
*
* @param {Tablet_Pair_This_Device_Or_Open_Everdash_Through_Home_AssistantInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_pair_this_device_or_open_everdash_through_home_assistant = /** @type {((inputs?: Tablet_Pair_This_Device_Or_Open_Everdash_Through_Home_AssistantInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Pair_This_Device_Or_Open_Everdash_Through_Home_AssistantInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Sparuj urządzenie lub otwórz EverDash przez Home Assistant.")
	return /** @type {LocalizedString} */ ("Pair this device or open EverDash through Home Assistant.")
});