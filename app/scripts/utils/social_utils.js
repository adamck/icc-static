define([
	'jquery',
	'underscore'

], function($, _) {
	'use strict';

	var SocialUtils = {

        getFacebookSharerUrl: function(url) {
            if(!url) url = window.location.href;

            return "https://www.facebook.com/sharer/sharer.php"+
                    "?u="+encodeURIComponent(url);
        },

        getTwitterSharerUrl: function(text, url) {
            if(!text) text = "";
            if(!url) url = window.location.href;

            return "https://twitter.com/intent/tweet"+
                    "?url="+encodeURIComponent(url)+
                    "&text="+encodeURIComponent(text);
        },


        getTumblrSharerUrl: function(name, url) {
            if(!name) name = "";
            if(!url) url = window.location.href;

            //tumblr share/link also support &description
            return "http://www.tumblr.com/share/link"+
                    "?url="+encodeURIComponent(url)+
                    "&name="+encodeURIComponent(name);
        },


        getTumblrSharerImageUrl: function(shareUrl, imgUrl, caption) {
            if(!shareUrl) shareUrl = window.location.href;
            if(!caption) caption = "";

            return "http://www.tumblr.com/share/photo"+
                    "?source="+encodeURIComponent(imgUrl)+
                    "&caption="+encodeURIComponent(caption)+
                    "&clickthru="+encodeURIComponent(shareUrl);
        },

        getPinterestSharerUrl: function(shareUrl, imgUrl, imgDesc) {
            if(!shareUrl) shareUrl = window.location.href;
            if(!imgDesc) imgDesc = "";
            if(!imgUrl) imgUrl = "";

            return "http://www.pinterest.com/pin/create/button/"+
                    "?url="+encodeURIComponent(shareUrl)+
                    "&media="+encodeURIComponent(imgUrl)+
                    "&description="+encodeURIComponent(imgDesc)+
                    "&data-pin-do='buttonPin'"+
                    "&data-pin-config='above'";
        },



        spawnWindow: function(url, winName) {
            if(!winName) winName = "";
            return window.open(url, winName, "resizable,scrollbars,status,width=700,height=475"); 
        }


	};

	return SocialUtils;
})
