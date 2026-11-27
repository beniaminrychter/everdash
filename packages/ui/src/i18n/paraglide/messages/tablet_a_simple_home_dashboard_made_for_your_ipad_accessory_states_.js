/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_A_Simple_Home_Dashboard_Made_For_Your_Ipad_Accessory_States_Inputs */



/**
* | output |
* | --- |
* | "A simple home dashboard, made for your iPad. Accessory states and controls connect through EverDash to Home Assistant." |
*
* @param {Tablet_A_Simple_Home_Dashboard_Made_For_Your_Ipad_Accessory_States_Inputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_a_simple_home_dashboard_made_for_your_ipad_accessory_states_ = /** @type {((inputs?: Tablet_A_Simple_Home_Dashboard_Made_For_Your_Ipad_Accessory_States_Inputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_A_Simple_Home_Dashboard_Made_For_Your_Ipad_Accessory_States_Inputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Prosty pulpit domowy na iPada. Dane i sterowanie urządzeniami łączą się przez EverDash z Home Assistant.")
	return /** @type {LocalizedString} */ ("A simple home dashboard, made for your iPad. Accessory states and controls connect through EverDash to Home Assistant.")
});