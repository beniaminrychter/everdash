/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Pairing_Complete_Opening_Your_DashboardInputs */



/**
* | output |
* | --- |
* | "Pairing complete. Opening your dashboard…" |
*
* @param {Tablet_Pairing_Complete_Opening_Your_DashboardInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_pairing_complete_opening_your_dashboard = /** @type {((inputs?: Tablet_Pairing_Complete_Opening_Your_DashboardInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Pairing_Complete_Opening_Your_DashboardInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Parowanie zakończone. Otwieranie pulpitu…")
	return /** @type {LocalizedString} */ ("Pairing complete. Opening your dashboard…")
});