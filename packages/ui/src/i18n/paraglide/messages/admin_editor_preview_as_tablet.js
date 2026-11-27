/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Editor_Preview_As_TabletInputs */



/**
* | output |
* | --- |
* | "Preview · as on the tablet" |
*
* @param {Admin_Editor_Preview_As_TabletInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_editor_preview_as_tablet = /** @type {((inputs?: Admin_Editor_Preview_As_TabletInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Editor_Preview_As_TabletInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Podgląd · jak na tablecie")
	return /** @type {LocalizedString} */ ("Preview · as on the tablet")
});