/*global define*/

define([
    'underscore',
    'backbone',
    'config'
], function (_, Backbone, Config) {
    'use strict';

    var InventoryCollection = Backbone.Collection.extend({

        url: (window.location.href.indexOf('.com') > -1 ? window.location.href : '') + Config.INVENTORY_URL,

        // Using this as a non-standard Backbone collection
        // no model, parse() won't return a value

    	parse: function(resp) {
            // format of resp is {'sku':qty, 'sku':qty, ...}
            // need to split this and create a hash out of it

            var values = {},
                qty, sku, skuEnd;

            //remove obj brackets
            resp = resp.substr(2,resp.length-1);

            //to an array of 'xxxxskuxxx':0 strings
            resp = resp.split(',');

            _.each(resp, function(str) {
                //format of str:
                // 'xxxskuxxxx':0

                skuEnd = str.indexOf('\':');
                sku = str.substr('1',skuEnd-1);
                qty = str.substr(skuEnd+2, str.length);

                values[String(sku)] = qty;
            });

            this.skus = values;
    	},


        getProductQty: function(sku) {
            return this.skus[sku];
        },

        /**
         * Direct access to sku:qty object
         */
        getInventory: function() {
            return this.skus;
        }
    });

    return InventoryCollection;

});
