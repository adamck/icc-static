define([
], function() {

	var Utils = {

		/**
		 * Applies Backbone method model.toJSON() to models in an array and returns the modified array
		 */
		arrModelsToJSON: function(arr) {
			_.each(arr, function(model, index) {
				arr[index] = model.toJSON();
			});
			return arr;
		},

		formatPrice: function(price) {
			price = parseFloat(price);

			//round float off at cents
			price = Math.round(price*100) / 100;

			//add .00 to a whole number
			var str = String(price);
			if(str.indexOf('.') < 0) {
				str += '.00';
			} else if(str.charAt(str.length-3) !== '.') {
				str += '0';
			}

			return str;
		}
	};

	return Utils;
});
