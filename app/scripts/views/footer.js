/*global define*/

define([
    'jquery',
    'underscore',
    'backbone',
    'templates',
    'events'
], function ($, _, Backbone, JST, Events) {
    'use strict';

    var FooterView = Backbone.View.extend({

        className: "footer-view",

        template: JST['app/scripts/templates/footer.ejs'],

        events: {
        	"click a.back": "onBackClick",
        	"click a.restart": "onRestartClick"
        },

        initialize: function() {
        	this.$el.html( this.template() );
        },

        onBackClick: function(e) {
        	e.preventDefault();
            CB.navToPage( 'backward' );
        },

        onRestartClick: function(e) {
        	e.preventDefault();
            CB.doRestart();
        },

        show: function() {
			this.$el.show();
        },

        hide: function() {
        	this.$el.hide();
        }
    });

    return FooterView;
});
