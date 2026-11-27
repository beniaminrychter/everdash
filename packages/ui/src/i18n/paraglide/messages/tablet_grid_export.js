/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Grid_ExportInputs */



/**
* | output |
* | --- |
* | "Grid export" |
*
* @param {Tablet_Grid_ExportInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_grid_export = /** @type {((inputs?: Tablet_Grid_ExportInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Grid_ExportInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Oddawanie do sieci")
	return /** @type {LocalizedString} */ ("Grid export")
});