/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Editor_Canvas_Open_BuilderInputs */



/**
* | output |
* | --- |
* | "Open the dashboard builder to load its current view." |
*
* @param {Editor_Canvas_Open_BuilderInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const editor_canvas_open_builder = /** @type {((inputs?: Editor_Canvas_Open_BuilderInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Editor_Canvas_Open_BuilderInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Otwórz kreator pulpitu, aby wczytać jego bieżący widok.")
	return /** @type {LocalizedString} */ ("Open the dashboard builder to load its current view.")
});