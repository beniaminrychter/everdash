/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Open_Everdash_Inside_Home_Assistant_While_Signed_In_To_An_AuInputs */



/**
* | output |
* | --- |
* | "Open EverDash inside Home Assistant while signed in to an authorized account." |
*
* @param {Tablet_Open_Everdash_Inside_Home_Assistant_While_Signed_In_To_An_AuInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_open_everdash_inside_home_assistant_while_signed_in_to_an_au = /** @type {((inputs?: Tablet_Open_Everdash_Inside_Home_Assistant_While_Signed_In_To_An_AuInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Open_Everdash_Inside_Home_Assistant_While_Signed_In_To_An_AuInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Otwórz EverDash w Home Assistant po zalogowaniu na uprawnione konto.")
	return /** @type {LocalizedString} */ ("Open EverDash inside Home Assistant while signed in to an authorized account.")
});