/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ name: NonNullable<unknown> }} Tablet_Name_Choose_DashboardInputs */



/**
* | output |
* | --- |
* | "{name}, choose dashboard" |
*
* @param {Tablet_Name_Choose_DashboardInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_name_choose_dashboard = /** @type {((inputs: Tablet_Name_Choose_DashboardInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Name_Choose_DashboardInputs, { locale?: "en" | "pl" }, {}>} */ ((i, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ (`${i?.name}, wybierz pulpit`)
	return /** @type {LocalizedString} */ (`${i?.name}, choose dashboard`)
});