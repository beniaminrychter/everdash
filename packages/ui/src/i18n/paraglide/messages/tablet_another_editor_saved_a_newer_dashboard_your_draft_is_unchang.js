/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Another_Editor_Saved_A_Newer_Dashboard_Your_Draft_Is_UnchangInputs */



/**
* | output |
* | --- |
* | "Another editor saved a newer dashboard. Your draft is unchanged." |
*
* @param {Tablet_Another_Editor_Saved_A_Newer_Dashboard_Your_Draft_Is_UnchangInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_another_editor_saved_a_newer_dashboard_your_draft_is_unchang = /** @type {((inputs?: Tablet_Another_Editor_Saved_A_Newer_Dashboard_Your_Draft_Is_UnchangInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Another_Editor_Saved_A_Newer_Dashboard_Your_Draft_Is_UnchangInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Inny edytor zapisał nowszy pulpit. Twoja wersja robocza pozostała bez zmian.")
	return /** @type {LocalizedString} */ ("Another editor saved a newer dashboard. Your draft is unchanged.")
});