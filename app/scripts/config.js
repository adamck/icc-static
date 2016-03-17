/* global define */
define([
], function() {

	var ENV = "production";

	var Config = {

        //can be seen on the request to charms and forms JSON files, used as a cachebuster
        APP_VERSION: "1.0.20140702",
		TRANSITION_DUR: 300,
		BUILDER_URL: "http://www.ippolita.com/charm-creator",
		INVENTORY_URL: "data/inventory.txt",

		Share: {
			GENERATOR_URL: "/charmbuilder/create",
			FALLBACK_SHARE_IMAGE: "images/og-share-image.jpg",
			SHARED_IMAGE_URL: "https://s3.amazonaws.com/ippolita-media-"+ENV+"/",
			TWITTER_TEXT: "My good luck charms! Check out Ippolita's Charms Creator @ippolitajewelry #collectcuratecreate",
			PINTEREST_TEXT: "My latest creation! Check out Ippolita's Charms Creator @ippolitajewelry #collectcuratecreate http://www.ippolita.com/charm-creator"
		}
	}

	return Config;
});
