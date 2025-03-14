import { baseConfig } from "../config";
import iso from "iso-3166-1";

export const request = async (url) => {
	const response = await fetch(url, {
		headers: {
			"X-Api-Key" : baseConfig.apiKey,
		}
	});
	const data = await response.json();
	return data;
}

export const getISO_A3 = (countryName) => {
	const country = iso.whereAlpha2(countryName);
	console.log(country, countryName);
	return country ? country.alpha3 : "Unknown";
  };
