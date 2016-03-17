/*global define*/

define([
    'jquery',
    'underscore',
    'backbone',
    'templates',
    'utils',
    'events',

], function ($, _, Backbone, JST, Utils, Events) {
    'use strict';

    var PageHolderView = Backbone.View.extend({

    	className: 'page-holder-view',

        template: JST['app/scripts/templates/page_holder.ejs'],

        events: {
        	'click .product > a': 'onHolderClick',
        	'click a.next': 'onNextClick'
        },

        initialize: function() {
        },

        render: function() {
        	var holders = Utils.arrModelsToJSON( this.collection.getHolders() ),
        	    form = CB.buildData.get('form').toJSON();

        	this.$el.html(
                this.template({
            		holders: holders,
            		form: form
        	   })
            );

        	this.$formHolder = this.$el.find('.form-holder');

            //if a holder's been selected and we're navigating back to this page, select that holder
            if(CB.buildData.get('holder')) {
                var $prod = this.$el.find('.product a[data-product-sku=' + CB.buildData.get('holder').get('sku') + ']');
                this.selectHolder($prod);
            }

            return this;
        },

        onHolderClick: function(e) {
        	e.preventDefault();
        	var $prod = $(e.currentTarget);
            this.selectHolder( $prod );
        },

        selectHolder: function( $prod ) {
        	if($prod.hasClass('active')) {
        		//DESELECT
        		$prod.removeClass('active');
        		this.$formHolder.find('img').fadeOut();

        		CB.buildData.removeHolder();

        	} else {
        		// SELECT
        		// selection state
	        	this.$el.find('.product > a').removeClass('active');
	        	$prod.addClass('active');

	        	// clone selected holder onto the form
	        	var $img = $prod.find('.holder-img').clone();
	        	this.$formHolder.html( $img.fadeIn() );

                //
	        	var holderModel = this.collection.findWhere({sku: String($prod.data('productSku'))})
	        	CB.buildData.setHolder( holderModel );
        	}
        },

        onNextClick: function(e) {
        	e.preventDefault();
        	Backbone.Events.trigger( Events.GOTO_PAGE_CHARMS );
        }
    });

    return PageHolderView;
});
