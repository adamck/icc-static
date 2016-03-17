/*global define*/

define([
    'config',
    'underscore',
    'backbone',
    'models/form'
], function (Config, _, Backbone, FormModel) {
    'use strict';

    var FormsCollection = Backbone.Collection.extend({
    	url: '/data/forms.json?' + Config.APP_VERSION,
        model: FormModel,

        initialize: function() {},

        getBracelets: function() {
            return this.where({
                type: 'bracelet'
            });
        },

        getNecklaces: function() {
            return this.where({
                type: 'necklace'
            });
        },

        getHolders: function() {
            return this.where({
                type: 'holder'
            });
        }
    });

    return FormsCollection;
});
