define([
    'jquery',
    'config'

], function($, Config) {

    var GA = {

        // Ref: https://developers.google.com/analytics/devguides/collection/analyticsjs/events

        // init: function() {
            // TODO: may not even need this method if we have ga('create') on index.html
            // console.log("goog-analytics: init", Config.GOOGLE_ANALYTICS_ACCOUNT)
        // },

        trackEventValue: function(category, action, label, valueInt) {
            // console.log('GA track value', category, action, label, valueInt)
            // ga('send', 'event', 'category', 'action', 'label', value);  // value is a number.
            ga('send', 'event', category, action, label, valueInt);
        },

        trackEventObject: function(category, action, object) {
            // console.log("GA track obj", category,action, object)
            // ga('send', 'event', 'category', 'action', {'page': '/my-new-page'});
            ga('send', 'event', category, action, object);
        }
    };

    return GA;
});
