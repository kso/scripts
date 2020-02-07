const axios = require("axios");
const dedupe = require("array-dedupe");
const config = require("./config.json");

async function getAllStoreLatLng() {
	let result = [];
	for(let i=0; i < config.locations.length; i++) {
		try {
			let response = await axios.get(config.walmart.storeLocatorAPI + config.locations[i]);
			// console.log(response.data);
			if(response.data && response.data.code === 200) {
				let chunk = response.data.payload.stores.map(s => {
					return {
						displayName: s.displayName,
						latitude: s.geoPoint.latitude,
						longitude: s.geoPoint.longitude
					}
				});
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
			let response = await axios.get(`${config.walmart.storeStockAPI}${config.walmart.productId}&latitude=${lat}&longitude=${lng}`);

			if(response.data && response.data.info) {
				// console.log(response.data);
				let hasStock = response.data.info.filter(store => store.availableToSellQty > 0 || store.availabilityStatus !== "OUT_OF_STOCK");
				result.push(...hasStock);
				// console.log(`${i} of ${latlngs.length}`);
			}
		}
		catch(err) {
			console.log("ERR", err);
		}
	}
	return result;
}

function output(source, s, attributes) {
	let str = '';
	attributes.forEach(a => {
		str += (s[a] !== undefined? s[a]: '') + ',';				
	});
	console.log(`${source},${str}`);
}

async function scrapeWalmart() {
	let stores = dedupe(await getAllStoreLatLng(), ["displayName"]);
	// console.log(stores);
	let stocks = dedupe(await getStockFromLatLngs(stores), ["displayName"]);
	// console.log(stocks);
	
	if(stocks) {
		stocks.forEach(s => output('Walmart', s, config.walmart.attributes));
	}
}

async function scrapeStaples() {
	let data = {
		"zipCode":"L4B 4M6",
		"searchParam":"L4B 4M6",
		"radius":10000,
		"itemIds": [config.staples.productId],
		"tenantId":"StaplesCA",
		"locale":"en-CA",
		"immediatePickupOnly":false,
		"action":"addToCart",
		"isSTS":false,
		"isStoreHours":true,
		"yourStore":{"storeNumber":"155"}
	};

	let headers = {
		"user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.130 Safari/537.36",
		"content-type": "application/json",
		"x-ibm-client-id": "94d817c8-21f4-4420-99b5-f6ba018d32bc",
		"origin": "https://www.staples.ca"
	};

	let response = await axios.post(config.staples.storeStockAPI, JSON.stringify(data), { headers: headers });
	if(response && response.data && response.data.pickInStoreDetails && response.data.pickInStoreDetails.length > 0){
		let details = response.data.pickInStoreDetails[0];

		details.store.forEach(s => output('Staples', s, config.staples.attributes));

	}
 }

 async function scrapeCVS() {
 	let data = {
 		"getStoreDetailsAndInventoryRequest":{
 			"header":{"apiKey":"a2ff75c6-2da7-4299-929d-d670d827ab4a","apiSecret":"a8df2d6e-b11c-4b73-8bd3-71afc2515dae","appName":"CVS_WEB","channelName":"WEB","deviceType":"DESKTOP","version":"1.0","deviceToken":"device12345","lineOfBusiness":"RETAIL","responseFormat":"JSON","securityType":"apiKey","source":"CVS_WEB","type":"rdp"},
 			"productId": config.cvs.productId,
 			"geolatitude":"",
 			"geolongitude":""
 		}
 	};

 	for(let i=0; i < config.locations.length; i++) {
 		data.addressLine = config.locations[i];
 		let response = await axios.post(config.cvs.storeStockAPI, JSON.stringify(data));
 		// console.log(response.data);

 		if(response && response.data && response.data.atgResponse) {
 			response.data.atgResponse.forEach(s => output('CVS', s, config.cvs.attributes));
 		}
 	}
 }

 async function scrapeWalgreens() {
 	let data = {
	  "q": "New York, NY, USA",
	  "requestType": "findAtYourLocal",
	  "inStockOnly": "true",
	  "skuId": config.walgreens.productId,
	  "p": "1",
	  "s": "100",
	  "r": "10000",
	  "lat": "40.7127753",
	  "lng": "-74.0059728",
	  "plnId": "40000384673",
	  "zip": "New York, NY, USA"
	};

	let headers = {
		"Content-Type": "application/json",
		"user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.130 Safari/537.36",
		"sec-fetch-mode": "cors"
	}
	let response = await axios.post(config.walgreens.storeStockAPI, JSON.stringify(data), {headers: headers});
	// console.log(response.data);
	if(response && response.data && response.data.results) {
		response.data.results.forEach(s => {
			console.log(`Walgreen,${s.storeNumber},${s.store.address.locationName},${s.store.address.city} - ${s.store.address.intersection},${s.store.phone.areaCode}${s.store.phone.number},,${s.inventory.inventoryCount},${s.inventory.status}`);
		});
	}
 }

console.log(config.headers.reduce((a,c) => `${a}${c},`, ''));
// scrapeWalmart();
// scrapeStaples();
scrapeCVS();
scrapeWalgreens();