/*global define, Crypto*/

define([
    'underscore',
    'backbone',
    'utils',
    'crypto',
    'crypto.MD5'

], function (_, Backbone, Utils) {
    'use strict';

    var BuildModel = Backbone.Model.extend({

        defaults: {
        	name: 'build model',
        	totalCost: 0,
        	charms: [],
        	cartProducts: []
        },

        initialize: function() {
            this.setNewSessionId();
        },

        setNewSessionId: function() {
            var str = String(new Date().getTime()) + window.navigator.userAgent;
            this.seshId = Crypto.util.bytesToBase64( Crypto.MD5(str) );
        },

        incCart: function( priceFloat ) {
            var newCost = parseFloat(this.get('totalCost')) + priceFloat;
            this.set('totalCost', Utils.formatPrice(newCost));
        },

        decCart: function( priceFloat ) {
            var newCost = parseFloat(this.get('totalCost')) - priceFloat;
            this.set('totalCost', Utils.formatPrice(newCost));
        },

        /**
         * Returns an array of product SKUs
         */
        getCartProductEcommIds: function() {
            var prods = _.clone(this.get('cartProducts'));
            var ids = [];
            _.each(prods, function(p) {
                ids.push( p.ecommId );
            });
            return ids;
        },

        addToCart: function(productModel, charmId) {
        	var prods = _.clone(this.get('cartProducts'));
        	var prodId = charmId ? charmId : productModel.get('sku');

        	prods.push({
        		id: prodId,
        		sku: productModel.get('sku'),
                ecommId: productModel.get('prod_id'),
        		name: productModel.get('name'),
        		price: productModel.get('price')
        	});

        	this.set('cartProducts', prods);
        	this.incCart( parseFloat(productModel.get('price')) );
        },


        /**
         * @param productId An ID for charms, a sku for other products
         */
        removeFromCart: function(productId) {
        	var prods = _.clone(this.get('cartProducts'));
            var prod = _.findWhere(prods, {id: productId});
            if(!prod) {
                //failsafe.
                console.log('shouldnt get here. tried removing a product from the cart that wasnt there');
                return;
            }

            prods = _.reject(prods, function(prod) {
                return prod.id === productId
            });

            this.set('cartProducts', prods);
        	this.decCart( parseFloat(prod.price) );
        },


        setForm: function(formModel) {
        	if(this.get('form')) {
        		this.removeFromCart( this.get('form').get('sku') );
        	}
    		this.addToCart( formModel );
        	this.set('form', formModel);
        	if(!formModel.get('charmHolder') && this.get('holder')) {
        		this.removeHolder();
        	}
        },


        setHolder: function(holderModel) {
        	if(this.get('holder')) {
        		this.removeFromCart( this.get('holder').get('sku') );
        	}
        	this.addToCart( holderModel );
        	this.set('holder', holderModel);
        },


        removeHolder: function() {
        	this.removeFromCart( this.get('holder').get('sku') );
        	this.unset('holder');
        },


        /**
         * @param necklaceSide optional - only pertains to necklaces obvs
         * @param sideIndex optional - only pertains to necklaces obvs
         */
        addCharm: function(charmModel, id, slotIndex, necklaceSide, sideIndex) {
        	var cs = _.clone(this.get('charms'));

        	cs.push({
				id: id,
        		slotIndex: slotIndex,
        		necklaceSide: necklaceSide,
                sideIndex: sideIndex
        	});

			this.set('charms', cs);
        	this.addToCart( charmModel, id );
        },


        removeCharm: function(id) {
        	// if this ID is found among the current set (and it better), remove it
        	var cs = _.clone(this.get('charms'));
        	var removed = _.reject(cs, function(c) {
        		return c.id === id
        	});
        	this.set('charms', removed);

            //the conditional just to validate it was found
            if(removed.length < cs.length) {
            	this.removeFromCart( id );
            }
        },


        updateNecklaceCharm: function(id, slotIndex, necklaceSide, sideIndex) {
            var cs = _.clone(this.get('charms'));

            //update by removing and re-adding
            cs = _.reject(cs, function(c) {
                return c.id === id
            });

            cs.push({
                id: id,
                slotIndex: slotIndex,
                necklaceSide: necklaceSide,
                sideIndex: sideIndex
            });

            this.set('charms', cs);
        },


        removeAllCharms: function() {
        	var self = this;
        	var cs = _.clone(this.get('charms'));
        	_.each(cs, function(c) {
        		self.removeCharm( c['id'] )
        	});
        },


        getNextAvailableSlotCoordIndex: function( side ) {
            var index = 0,
                cs,
                indexKey;

            if(side) {
                cs = this.filterCharmsBySide(side);
                indexKey = 'sideIndex';
            } else {
                cs = _.clone(this.get('charms'));
                indexKey = 'slotIndex';
            }

            //sort by sideIndex
            cs = _.sortBy(cs, function(obj) { return obj[indexKey]; });

            //finds lowest index that isn't taken
            _.each(cs, function(charmObj) {
                index = (charmObj[indexKey] === index) ? index + 1 : index;
            });

            //means every spot is taken
            if(index > cs.length) {
                index = -1;
            }

            return index;
        },


        filterCharmsBySide: function(side) {
            var cs = _.clone(this.get('charms'));
            var sideCharms = _.filter( cs,
                function(obj) {
                    return obj['necklaceSide'] === side;
                }
            );
            return sideCharms;
        },


        getNumCharms: function() {
        	return this.get('charms').length;
        },


        getNumNecklaceCharms: function(side) {
            if(side) {
                return this.filterCharmsBySide(side).length;
            } else {
                var cs = _.clone(this.get('charms'));
                return cs.length;
            }
        }
    });

    return BuildModel;
});
