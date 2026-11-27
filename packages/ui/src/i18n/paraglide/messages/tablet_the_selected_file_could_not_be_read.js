/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_The_Selected_File_Could_Not_Be_ReadInputs */



/**
* | output |
* | --- |
* | "The selected file could not be read." |
*
* @param {Tablet_The_Selected_File_Could_Not_Be_ReadInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_the_selected_file_could_not_be_read = /** @type {((inputs?: Tablet_The_Selected_File_Could_Not_Be_ReadInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_The_Selected_File_Could_Not_Be_ReadInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Nie udało się odczytać wybranego pliku.")
	return /** @type {LocalizedString} */ ("The selected file could not be read.")
});