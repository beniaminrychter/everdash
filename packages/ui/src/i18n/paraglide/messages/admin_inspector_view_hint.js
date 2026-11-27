/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Inspector_View_HintInputs */



/**
* | output |
* | --- |
* | "Click a card, badge or section title in the preview to edit it. Sections are optional: add one with + Section to group cards under a heading." |
*
* @param {Admin_Inspector_View_HintInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_inspector_view_hint = /** @type {((inputs?: Admin_Inspector_View_HintInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Inspector_View_HintInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Kliknij kartę, plakietkę lub tytuł sekcji w podglądzie, aby je edytować. Sekcje są opcjonalne — dodaj sekcję przyciskiem + Sekcja, aby pogrupować karty pod nagłówkiem.")
	return /** @type {LocalizedString} */ ("Click a card, badge or section title in the preview to edit it. Sections are optional: add one with + Section to group cards under a heading.")
});