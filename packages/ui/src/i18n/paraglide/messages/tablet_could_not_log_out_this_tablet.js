/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Could_Not_Log_Out_This_TabletInputs */



/**
* | output |
* | --- |
* | "Could not log out this tablet." |
*
* @param {Tablet_Could_Not_Log_Out_This_TabletInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_could_not_log_out_this_tablet = /** @type {((inputs?: Tablet_Could_Not_Log_Out_This_TabletInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Could_Not_Log_Out_This_TabletInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Nie udało się wylogować tabletu.")
	return /** @type {LocalizedString} */ ("Could not log out this tablet.")
});