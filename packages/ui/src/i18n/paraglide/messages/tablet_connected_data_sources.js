/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Connected_Data_SourcesInputs */



/**
* | output |
* | --- |
* | "Connected data sources" |
*
* @param {Tablet_Connected_Data_SourcesInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_connected_data_sources = /** @type {((inputs?: Tablet_Connected_Data_SourcesInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Connected_Data_SourcesInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Źródła danych")
	return /** @type {LocalizedString} */ ("Connected data sources")
});