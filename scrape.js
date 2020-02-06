const axios = require("axios");

const storeLocatorAPI = "https://www.walmart.ca/en/stores-near-me/api/searchStores?singleLineAddr=";
const storeStockAPI = "https://www.walmart.ca/api/product-page/find-in-store?&lang=en&upc=";

const centers = ["brampton","whitby", "newmarket", "barrie", "toronto","mississauga","waterloo","kitchener","pickering","aurora"]; // what areas to look around?
const upc = "62891574558"; // represents the product

async function getAllStoreLatLng() {
	let result = [];
	for(let i=0; i < centers.length; i++) {
		try {
			let response = await axios.get(storeLocatorAPI + centers[i]);
			// console.log(response.data);
			if(response.data && response.data.code === 200) {
				let chunk = response.data.payload.stores.map(s => s.geoPoint);
				result.push(...chunk); 
			}
		}
		catch(err) {
			console.log("ERR", err);
		}
	}
	return result;
}

async function getStockFromLatLngs(latlngs) {
	let result = [];
	for(let i=0; i<latlngs.length; i++) {
		try {
			let lat = latlngs[i].latitude;
			let lng = latlngs[i].longitude;
			let response = await axios.get(`${storeStockAPI}${upc}&latitude=${lat}&longitude=${lng}`);

			if(response.data && response.data.info) {
				console.log(response.data);
				let hasStock = response.data.info.filter(store => store.availabilityStatus !== "OUT_OF_STOCK");
				result.push(...hasStock);
			}
		}
		catch(err) {
			console.log("ERR", err);
		}
	}
	return result;
}

async function main() {
	let stores = await getAllStoreLatLng();
	// console.log(stores);
	let stocks = await getStockFromLatLngs(stores);
	console.log("=====================");
	console.log(stocks);
}

main();