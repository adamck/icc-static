/*global define*/

define([
    'jquery',
    'underscore',
    'backbone',
    'templates',
    'events',
    'components/builder',

], function ($, _, Backbone, JST, Events, BuilderView) {
    'use strict';

    var PageCharmsView = Backbone.View.extend({

    	className: 'page-charms-view',

        template: JST['app/scripts/templates/page_charms.ejs'],

        /** Expects a CharmCollection **/
        initialize: function() {

            var charmsColl  = this.collection;
            var formModel   = CB.buildData.get('form');
            var holderModel = CB.buildData.get('holder');

            if(!charmsColl || !formModel) throw new Error('where my models at?');

            // clear all charm selections when you enter or re-enter the Charms page
            CB.buildData.removeAllCharms();

            var hasCharmHolder = CB.buildData.get('holder') === undefined ? false : true;
            var maxCharms = hasCharmHolder ? CB.buildData.get('holder').get('slots').length : formModel.getNumSlots();
			this.$el.html(
                this.template({
                    hasCharmHolder: hasCharmHolder,
                    maxCharms: maxCharms
                })
            );

            //create and insert builder into template
            var builderView = new BuilderView;
            builderView.init(charmsColl, formModel, holderModel);

            this.$el.append( builderView.el );
        }
    });

    return PageCharmsView;
});
