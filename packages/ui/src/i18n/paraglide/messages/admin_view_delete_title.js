/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ title: NonNullable<unknown> }} Admin_View_Delete_TitleInputs */



/**
* | output |
* | --- |
* | "Delete “{title}”?" |
*
* @param {Admin_View_Delete_TitleInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_view_delete_title = /** @type {((inputs: Admin_View_Delete_TitleInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_View_Delete_TitleInputs, { locale?: "en" | "pl" }, {}>} */ ((i, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ (`Usunąć „${i?.title}”?`)
	return /** @type {LocalizedString} */ (`Delete “${i?.title}”?`)
});