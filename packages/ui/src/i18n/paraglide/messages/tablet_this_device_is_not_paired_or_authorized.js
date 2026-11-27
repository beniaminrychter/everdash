/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_This_Device_Is_Not_Paired_Or_AuthorizedInputs */



/**
* | output |
* | --- |
* | "This device is not paired or authorized." |
*
* @param {Tablet_This_Device_Is_Not_Paired_Or_AuthorizedInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_this_device_is_not_paired_or_authorized = /** @type {((inputs?: Tablet_This_Device_Is_Not_Paired_Or_AuthorizedInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_This_Device_Is_Not_Paired_Or_AuthorizedInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("To urządzenie nie jest sparowane ani autoryzowane.")
	return /** @type {LocalizedString} */ ("This device is not paired or authorized.")
});