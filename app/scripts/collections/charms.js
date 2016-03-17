/*global define*/

define([
    'config',
    'underscore',
    'backbone',
    'models/charm'
], function (Config, _, Backbone, CharmModel) {
    'use strict';

    var CharmsCollection = Backbone.Collection.extend({
		url: 'data/charms.json?' + Config.APP_VERSION,
        model: CharmModel
    });

    return CharmsCollection;
});
