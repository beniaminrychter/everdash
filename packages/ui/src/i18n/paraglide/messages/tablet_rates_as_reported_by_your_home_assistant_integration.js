/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Rates_As_Reported_By_Your_Home_Assistant_IntegrationInputs */



/**
* | output |
* | --- |
* | "Rates as reported by your Home Assistant integration." |
*
* @param {Tablet_Rates_As_Reported_By_Your_Home_Assistant_IntegrationInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_rates_as_reported_by_your_home_assistant_integration = /** @type {((inputs?: Tablet_Rates_As_Reported_By_Your_Home_Assistant_IntegrationInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Rates_As_Reported_By_Your_Home_Assistant_IntegrationInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Ceny z integracji Home Assistant.")
	return /** @type {LocalizedString} */ ("Rates as reported by your Home Assistant integration.")
});