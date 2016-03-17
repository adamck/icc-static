/*global define, CB*/

define([
    'jquery',
    'underscore',
    'backbone',
    'config',
    'templates',
    'events',
    'html2canvas',
    'views/modal',
    'utils/social_utils',
    'vendor/goog-analytics'

], function ($, _, Backbone, Config, JST, Events, html2canvas, ModalView, SocialUtils, GA) {
    'use strict';

    var HeaderView = Backbone.View.extend({

    	className: 'header-view',

        template: JST['app/scripts/templates/header.ejs'],

        events: {
        	'click a.buy-cta': 'onToggleDropdown',
        	'click a.add-cart': 'onAddToCart',
            'click .share-ctas a': 'onShareClick'
        },

        initialize: function() {
            this.listenTo(CB.buildData, 'change', _.bind( this.render, this));

            this.render();
            this.isCartHidden = this.isSocialHidden = false;
        },

        render: function() {
        	this.$el.html( this.template( CB.buildData.toJSON() ));

            this.$cart     = this.$el.find('.cart');
            this.$social   = this.$cart.children('.share-cont');
        	this.$buyBtn   = this.$cart.children('.buy-cta');
        	this.$dropdown = this.$cart.children('.dropdown');

            if(this.isHidden) {
                this.hide();
            } else {
                this.show(!this.isCartHidden, !this.isSocialHidden);
            }

        	return this;
        },

        hide: function() {
            this.isHidden = true;
            this.$el.hide();
        },

        show: function(showCart, showSocial) {
            this.isHidden = false;
            this.isCartHidden = !showCart;
            this.isSocialHidden = !showSocial;
        	this.$el.show();
            showCart ? this.$cart.show() : this.$cart.hide();
            showSocial ? this.$social.show() : this.$social.hide();
        },


        onToggleDropdown: function(e) {
            e.preventDefault();
        	this.$dropdown.toggleClass('active');

            //track opening of dropdown
            if(this.$dropdown.hasClass('active')) {
                GA.trackEventValue('cart', 'click', 'click-review-your-creation');
            }
        },


        onAddToCart: function(e) {
        	e.preventDefault();
            Backbone.Events.trigger( Events.CHECKOUT );

            GA.trackEventValue('cart', 'click', 'click-add-to-bag');
        },

        /* TODO: abstract sharing functionality outside of HeaderView */

        onShareClick: function(e) {
            e.preventDefault();

            //for finishShare() once we get back from the server post
            var sid = this.shareCtaId = $(e.currentTarget).attr('id');

            var networkLabel = sid === 'cta-tw' ? 'twitter' : sid === 'cta-fb' ? 'facebook' : 'pinterest';
            GA.trackEventValue('social', 'click', 'click-social-network-'+networkLabel);

            if(sid === 'cta-tw') {
                //twitter doesn't need a screenshot or shareUrl
                this.finishShare();

            } else if(!Modernizr.canvas) {
                //old browsers - just share charms-builder page
                this.finishShare( Config.BUILDER_URL, Config.Share.FALLBACK_SHARE_IMAGE );

            } else {

                // launch a blank window while we can still avoid popup blockers.
                // its url will be set later in finishShare() after the canvas render and save
                this.shareWin = SocialUtils.spawnWindow('', 'cb_share_win');

                //show the modal while we generate the image
                Backbone.Events.trigger( Events.SHOW_SHARE_MODAL );

                // DEV
                // _.delay(_.bind(this.finishShare, this), 2000);
                // return;

                //take canvas screenshot, save it to Generator, callback and launch share popup
                var self = this;

                var h2cOptions = {
                    onrendered: function(canvas) {
                        var shareData = {
                            cbid:  CB.buildData.seshId,
                            image: canvas.toDataURL()
                        };

                        // FOR DEV
                        // window.open().document.write('<img src="'+canvas.toDataURL()+'"/>');
                        // return;
                        /////////

                        $.ajax({
                            type: 'POST',
                            url: Config.Share.GENERATOR_URL,
                            data: JSON.stringify(shareData),
                            contentType: 'application/json',
                            dataType: 'json',
                            async: false,
                            success: _.bind(self.onShareCallback, self),
                            error: _.bind(self.onShareError, self)
                        });
                    }
                };


                // Crop the shared image tighter for each of the differnt configs
                // Note that if the whitespace around form images ever change, these values may need to be modified.
                if( CB.buildData.get('form').get('type') === 'necklace' ) {

                    if(CB.buildData.get('holder')) {
                        //necklace with a charm holder added
                        h2cOptions.offsetW = 300;
                        h2cOptions.offsetH = 300;
                        h2cOptions.offsetX = -$('.form-image').position().left - 150;
                        h2cOptions.offsetY = -350;

                    } else if(!CB.buildData.get('form').get('charmHolder')) {
                        //one of the necklaces that is bundled with a holder (ie, it's model knows it can't have one added)
                        h2cOptions.offsetW = 300;
                        h2cOptions.offsetH = 300;
                        h2cOptions.offsetX = -$('.form-image').position().left - 150;
                        h2cOptions.offsetY = -250;

                    } else {
                        //necklace without a holder
                        h2cOptions.offsetW = 500;
                        h2cOptions.offsetH = 500;
                        h2cOptions.offsetX = -$('.form-image').position().left - 50;
                        h2cOptions.offsetY = -200;
                    }

                } else {
                    //bracelet
                    h2cOptions.offsetH = 750;
                    h2cOptions.offsetY = 75;
                }

                html2canvas( document.getElementById('share_container') , h2cOptions );
            }
        },


        onShareCallback: function(data, status, xhr) {
            // console.log('yeahhh, share succ', data, status)
            var genShareUrl = window.location.href + '/charmbuilder/' + data.charm.cbid;
            var genImgUrl = Config.Share.SHARED_IMAGE_URL + data.charm.cbid + '.png';

            //so that changes and additional shares will create a new share location
            CB.buildData.setNewSessionId();
            //close the modal opened in onShareClick()
            CB.hideModal();

            this.finishShare( genShareUrl, genImgUrl );
        },

        onShareError: function(xhr, status, err) {
            // console.log('yowza, no good')
            // TODO: error messaging
        },

        finishShare: function( shareUrl, imageUrl ) {
            if(!this.shareCtaId) throw new Error();

            var url,
                twitText = Config.Share.TWITTER_TEXT,
                pinterestText = Config.Share.PINTEREST_TEXT;

            switch(this.shareCtaId) {
                case 'cta-fb':
                    url = SocialUtils.getFacebookSharerUrl(shareUrl);
                break;
                case 'cta-tw':
                    url = SocialUtils.getTwitterSharerUrl(twitText, Config.BUILDER_URL);
                break;
                case 'cta-pt':
                    url = SocialUtils.getPinterestSharerUrl(Config.BUILDER_URL, imageUrl, pinterestText);
                break;
            }

            if(this.shareWin) {
                this.shareWin.location.href = url;
                this.shareWin.focus();
            } else {
                SocialUtils.spawnWindow(url, 'cb_share_win');
            }

            this.shareWin = null;
            this.shareCtaId = null;
        }
    });

    return HeaderView;
});
