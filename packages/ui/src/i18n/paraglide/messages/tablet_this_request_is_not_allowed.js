/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_This_Request_Is_Not_AllowedInputs */



/**
* | output |
* | --- |
* | "This request is not allowed." |
*
* @param {Tablet_This_Request_Is_Not_AllowedInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_this_request_is_not_allowed = /** @type {((inputs?: Tablet_This_Request_Is_Not_AllowedInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_This_Request_Is_Not_AllowedInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("To żądanie jest niedozwolone.")
	return /** @type {LocalizedString} */ ("This request is not allowed.")
});