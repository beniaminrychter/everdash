/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Youre_Offline_Controls_Will_Reconnect_When_The_Network_ReturInputs */



/**
* | output |
* | --- |
* | "You’re offline. Controls will reconnect when the network returns." |
*
* @param {Tablet_Youre_Offline_Controls_Will_Reconnect_When_The_Network_ReturInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_youre_offline_controls_will_reconnect_when_the_network_retur = /** @type {((inputs?: Tablet_Youre_Offline_Controls_Will_Reconnect_When_The_Network_ReturInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Youre_Offline_Controls_Will_Reconnect_When_The_Network_ReturInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Brak połączenia z siecią. Sterowanie wróci po odzyskaniu połączenia.")
	return /** @type {LocalizedString} */ ("You’re offline. Controls will reconnect when the network returns.")
});