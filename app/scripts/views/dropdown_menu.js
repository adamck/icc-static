/*global define*/

define([
    'jquery',
    'underscore',
    'backbone',
    'templates'

], function ($, _, Backbone, JST) {
    'use strict';

    var DropdownMenuView = Backbone.View.extend({

        className: "dropdown-menu-view",
        template: JST['app/scripts/templates/dropdown_menu.ejs'],

        /**
         * Expects a collection of {id, label} objects for populating the menu
         */
        initialize: function() {
        },

        render: function(  ) {
            this.$el.html(
                this.template({
                    subcats: this.collection
                })
            );
            this.$select = this.$el.find('.select-menu');
            this.$select.on('change', _.bind(this.onMenuSelect, this.$select))

            return this;
        },

        onMenuSelect: function() {
            // console.log('menu sleect', this.val(), DropdownMenuView.EVENT_SELECT)
            Backbone.Events.trigger(DropdownMenuView.EVENT_SELECT, this.val() );
        }
    });

    DropdownMenuView.EVENT_SELECT = 'event:select';

    return DropdownMenuView;
});
