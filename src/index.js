import { baseConfig } from "../config";


export const request = async (url) => {
	const response = await fetch(url, {
		headers: {
			"X-Api-Key" : baseConfig.apiKey,
		}
	});
	const data = await response.json();
	return data;
}
