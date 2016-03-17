/*global require*/
'use strict';

require.config({
    shim: {
        underscore: {
            exports: '_'
        },
        backbone: {
            deps: [
                'underscore',
                'jquery'
            ],
            exports: 'Backbone'
        },
        html2canvas: {
            exports: 'html2canvas'
        },
        velocity: {
            deps: ['jquery']
        },
        crypto: {
            exports: 'CryptoJS'
        },
        'crypto.MD5': {
            deps: ['crypto'],
        }
    },

    paths: {
        jquery:         ['http://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min', '../bower_components/jquery/jquery'],
        backbone:       ['http://cdnjs.cloudflare.com/ajax/libs/backbone.js/1.0.0/backbone-min', '../bower_components/backbone/backbone'],
        underscore:     ['http://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.6.0/underscore-min', '../bower_components/underscore/underscore'],
        crypto:         '../bower_components/cryptojs/lib/Crypto',
        'crypto.MD5':   '../bower_components/cryptojs/lib/MD5',
        html2canvas:    'vendor/html2canvas_ak/build/html2canvas',
        velocity:       'vendor/jquery.velocity'
    }
});


require([
    'jquery',
    'backbone',
    'app'

], function ($, Backbone, CBApp) {
    // kick it all off
    window.CB = new CBApp({
        el: $('#cb_cont')
    });
});
