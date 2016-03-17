/*global define*/

define([
    'jquery',
    'underscore',
    'backbone',
    'templates',
    'events',
    'vendor/imagesloaded.pkgd'
], function ($, _, Backbone, JST, Events, ImagesLoaded) {
    'use strict';

    var PageLandingView = Backbone.View.extend({

    	className: 'page-landing-view',

        template: JST['app/scripts/templates/page_landing.ejs'],

        events: {
            'click .start': 'onStartClick'
        },

        initialize: function() {
        	this.$el.html(this.template());
            ImagesLoaded(this.$el, function() {
                Backbone.Events.trigger(Events.REQUEST_PAGE_RESIZE);
            });

            return this;
        },

        onStartClick: function(e) {
            e.preventDefault();
            Backbone.Events.trigger( Events.GOTO_PAGE_FORM );
        }
    });

    return PageLandingView;
});
