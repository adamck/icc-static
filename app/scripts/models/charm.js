/*global define*/

define([
    'underscore',
    'backbone'
], function (_, Backbone) {
    'use strict';

    var CharmModel = Backbone.Model.extend({
        defaults: {}
    });

    return CharmModel;
});
