/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Editor_Canvas_No_ViewInputs */



/**
* | output |
* | --- |
* | "This dashboard has no view to display." |
*
* @param {Editor_Canvas_No_ViewInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const editor_canvas_no_view = /** @type {((inputs?: Editor_Canvas_No_ViewInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Editor_Canvas_No_ViewInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Ten pulpit nie ma żadnego widoku do wyświetlenia.")
	return /** @type {LocalizedString} */ ("This dashboard has no view to display.")
});