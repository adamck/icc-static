/*global define*/

define([
    'underscore',
    'backbone'
], function (_, Backbone) {
    'use strict';

    var FormModel = Backbone.Model.extend({
        defaults: {
        	slots: []
        },

        initialize: function() {
        },

        getSlotCoordsByIndex: function(slotIndex) {
            var s = this.get('slots')[slotIndex];
            return s;
        },

        getSlotCoordsBySide: function(side, slotIndex) {
            var sideSlots = this.getSlotsOfSide(side);
			// console.log('getSlotCoordsBySide', this.get('slots'), sideSlots, slotIndex, side)
        	return sideSlots[slotIndex];
        },

        getIndexOfSlot: function(slotObj) {
        	var slots = this.get('slots'),
                i = -1;

        	_.each(slots, function(obj, index) {
        		if(_.isEqual(obj, slotObj)) {
        			i = index;
        			return;
        		}
        	});

        	return i;
        },

        getSideIndexOfSlot: function(slotObj) {
            // console.log('getSideIndexOfSlot', slotObj.side, slotObj.x);
            var sideSlots = this.getSlotsOfSide( slotObj.side ),
                i = -1;

            _.each(sideSlots, function(obj, index) {
                if(_.isEqual(obj, slotObj)) {
                    i = index;
                    return;
                }
            });

            return i;
        },

        getSlotsOfSide: function(side) {
            return _.filter(this.get('slots'), function(obj) {
                return obj.side === side;
            });
        },

        getNumSlots: function() {
        	return this.get('slots').length;
        }
    });

    return FormModel;
});
