/*global define*/

define([
    'jquery',
    'underscore',
    'backbone',
    'templates',
    'events'
], function ($, _, Backbone, JST, Events) {
    'use strict';

    var ModalView = Backbone.View.extend({

    	className: 'modal-view',

        template: JST['app/scripts/templates/modal.ejs'],

        events: {
            'click .cta-continue': 'onClickContinue',
            'click .cta-start-over': 'onClickStartOver',
            'click .cta-checkout': 'onClickCheckout',
            'click': 'onClickScrim'
        },

        render: function( contentId ) {
        	this.$el.html(this.template({
        		contentId: contentId
        	}));
        	return this;
        },

        onClickContinue: function(e) {
            this.preventPropagation(e);
            Backbone.Events.trigger( Events.GOTO_IPPOLITA_HP );
        },

        onClickStartOver: function(e) {
            this.preventPropagation(e);
            Backbone.Events.trigger( Events.RESTART );
            this.onClickScrim();
        },

        onClickCheckout: function(e) {
            this.preventPropagation(e);
            Backbone.Events.trigger( Events.GOTO_MAGENTO_CART );
        },

        preventPropagation: function(e) {
            e.stopPropagation();
            e.preventDefault();
        },

        onClickScrim: function() {
            //default capture for clicks allowed to propagate
            Backbone.Events.trigger(Events.HIDE_MODAL);
        }

    });

    ModalView.CHECKOUT          = 'checkout';
    ModalView.CHECKOUT_SUCCESS  = 'checkout-success';
    ModalView.CHECKOUT_ERROR    = 'checkout-error';
    ModalView.SHARE             = 'share';

    return ModalView;
});
