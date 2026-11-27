/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Everdash_Home_Assistant_DashboardInputs */



/**
* | output |
* | --- |
* | "EverDash · Home Assistant dashboard" |
*
* @param {Tablet_Everdash_Home_Assistant_DashboardInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_everdash_home_assistant_dashboard = /** @type {((inputs?: Tablet_Everdash_Home_Assistant_DashboardInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Everdash_Home_Assistant_DashboardInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("EverDash · Pulpit Home Assistant")
	return /** @type {LocalizedString} */ ("EverDash · Home Assistant dashboard")
});