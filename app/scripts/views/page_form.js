/*global define*/

define([
    'jquery',
    'underscore',
    'backbone',
    'templates',
    'events',
    'utils',

], function ($, _, Backbone, JST, Events, Utils) {
    'use strict';

    var PageFormView = Backbone.View.extend({

    	className: 'page-form-view',

        template: JST['app/scripts/templates/page_form.ejs'],

        events: {
        	'click .product > a': 'onProdClick',
        },

        /** Expects FormCollection **/
        initialize: function() {
			var bracelets = this.collection.getBracelets();
			var necklaces = this.collection.getNecklaces();

        	this.$el.html( this.template( {
        		"bracelets": Utils.arrModelsToJSON(bracelets),
        		"necklaces": Utils.arrModelsToJSON(necklaces)
        	}));

            return this;
        },


        onProdClick: function(e) {
        	e.preventDefault();
        	var $prod = $(e.currentTarget);

        	//selected state
        	this.$el.find('.product > a').removeClass('active');
        	$prod.addClass('active');

        	//enable next button
        	this.$el.find('a.next').removeClass('disabled');

        	//save sku to build model
        	var formModel = this.getFormModel( $prod.data('formSku') );
        	if(!formModel)
        		throw new Error("couldn't find form model with sku", $(e.currentTarget).data('formSku'));
       		CB.buildData.setForm( formModel );

        	// go to either charms page or holder page
        	var evt;
        	if(CB.buildData.get('form').get('charmHolder')) {
        		evt = Events.GOTO_PAGE_HOLDER;
        	} else {
        		evt = Events.GOTO_PAGE_CHARMS;
        	}
        	Backbone.Events.trigger( evt );
        },


        getFormModel: function(formSku) {
        	return this.collection.findWhere({sku: String(formSku)});
        }
    });

    return PageFormView;
});
