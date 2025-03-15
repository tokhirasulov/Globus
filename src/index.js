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
  export const getCountryName = (countryCode) => {
	const country = iso.whereAlpha3(countryCode)
	return country ? country.country : "Unknown";
  }

  export const formatData = (fromCityCoordinates, toCityCoordinates) => {
	const fromCityData = fromCityCoordinates[0];
	const toCityData = toCityCoordinates[0];
	return [{
		startLat: fromCityData.latitude,
		startLng: fromCityData.longitude,
		endLat: toCityData.latitude,
		endLng: toCityData.longitude,
		arcAlt: 0.2,
		status: true // Example property for arc color
	  }];

}
export const labels = (city) => {
		return {
			text: getISO_A3(city.country),
            size: 1.0,
            country: getCountryName(city.country),
            city: city.name,
            lat: city.latitude,
			lng: city.longitude
		}
	}
