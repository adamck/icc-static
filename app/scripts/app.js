if(typeof window.console === undefined) {
    window.console = console = {log: function() {}, warn: function() {}};
}

/*global define*/
define([
	'jquery',
	'backbone',
	'events',
	'config',
	'collections/inventory',
	'collections/forms',
	'collections/charms',
	'models/build',
	'views/modal',
	'views/header',
	'views/footer',
	'views/page_landing',
	'views/page_form',
	'views/page_holder',
	'views/page_charms',
    'vendor/imagesloaded.pkgd',
    'velocity'

], function($, Backbone, Events, Config,
			InventoryCollection, FormsCollection, CharmsCollection,
			BuildModel,
			ModalView, HeaderView, FooterView, PageLandingView, PageFormView, PageHolderView, PageCharmsView,
			ImagesLoaded) {

	'use strict';

	var CBApp = Backbone.View.extend({

		PAGE_LANDING 	: 'landing',
		PAGE_FORM 		: 'form',
		PAGE_HOLDER 	: 'holder',
		PAGE_CHARMS 	: 'charms',
		PAGE_BACKWARD 	: 'backward',

		initialize: function() {

			// app events
			Backbone.Events.on( Events.GOTO_PAGE_LANDING, 	_.bind(this.navToPage, this, 'landing') );
			Backbone.Events.on( Events.GOTO_PAGE_FORM, 		_.bind(this.navToPage, this, 'form') );
			Backbone.Events.on( Events.GOTO_PAGE_HOLDER, 	_.bind(this.navToPage, this, 'holder') );
			Backbone.Events.on( Events.GOTO_PAGE_CHARMS, 	_.bind(this.navToPage, this, 'charms') );
			Backbone.Events.on( Events.GOTO_BACK, 			_.bind(this.navToPage, this, 'backward') );

			Backbone.Events.on( Events.RESTART,				_.bind(this.doRestart, this));
			Backbone.Events.on( Events.REQUEST_PAGE_RESIZE, _.bind(this.doResizePage, this));
			Backbone.Events.on( Events.CHECKOUT,			_.bind(this.doCheckout, this));
            Backbone.Events.on( Events.GOTO_MAGENTO_CART,   _.bind(this.gotoMagentoCart, this));
            Backbone.Events.on( Events.GOTO_IPPOLITA_HP,    _.bind(this.gotoIppoHomepage, this));

			Backbone.Events.on( Events.SHOW_SHARE_MODAL,	_.bind(this.showModal, this, ModalView.SHARE));
			Backbone.Events.on( Events.SHOW_CART_MODAL,		_.bind(this.showModal, this, ModalView.CHECKOUT));
			Backbone.Events.on( Events.HIDE_MODAL, 			_.bind(this.hideModal, this));

			// postMessage window listeners
			if (window.addEventListener) {
			 	addEventListener("message", _.bind(this.onPostMessageRecvd, this), false);
			} else {
			 	attachEvent("onmessage", _.bind(this.onPostMessageRecvd, this));
			}

			this.formsData 		= new FormsCollection;
			this.charmsData 	= new CharmsCollection;
			this.inventoryData 	= new InventoryCollection;

			//model of this session's configuration
			this.buildData 		= new BuildModel;

			// Load Order
			//  forms
			//	inventory  -- invntoryData won't 'sync' so no listener -- see its fetch error response
			//  charms
			this.formsData.once('sync', _.bind(this.getInventoryData, this));
			this.charmsData.once('sync', _.bind(this.processData, this));

			this.formsData.fetch();
		},

		getInventoryData: function() {
			var self = this;
			this.inventoryData.fetch({
				success: function(coll, resp, opts) {
					console.log('inv succ', resp);
				},
				error: function(coll, resp, opts) {
					//plain text ends up in 'error'
					// console.log('inv error ', resp)
					if(resp.status === 200) {
						coll.parse(resp.responseText);
						//continue w app init
						self.getCharmsData();

					} else {
						console.warn("ERROR getting inventory data");
						// do what? continue w/out inventory data?
					}
				}
			});
		},

		getCharmsData: function() {
			this.charmsData.fetch();
		},

		/**
		 * Last step in data initialization. Kicks off UI init'ing once complete
		 */
		processData: function() {
			//remove any products with a negative qty from inventory data
			var self = this,
				qty,
				processStock = function(model) {
					//Quantity Rules
					// 0 = unavailable
					// any other number means available - exactly that absolute value are available. but we don't really care...
					qty = parseInt( self.inventoryData.getProductQty( model.get('sku') ) );
					// console.log('inv', model.get('sku), qty, 'avail?', (qty !== 0));
					model.set('available', (qty !== 0));
				};
			_.each(this.charmsData.models, processStock);
			_.each(this.formsData.models, processStock);

            //kick off
			this.initUi();
			this.navToPage(this.PAGE_LANDING);
		},


		initUi: function() {
			// Global app views
			this.modalView  = new ModalView;
			this.headerView = new HeaderView;
			this.footerView = new FooterView;

			//hidden on landing page
			this.headerView.hide();
			this.footerView.hide();

			this.$modal 	= this.$el.find('.modal-cont');
			this.$header 	= this.$el.find('.header-cont');
			this.$page 		= this.$el.find('.page-cont');
			this.$footer 	= this.$el.find('.footer-cont');

			// Handy dev shortcuts
			// CB.buildData.setForm( this.formsData.at(1) );
			// CB.buildData.setForm( this.formsData.at(4) );

			this.$header.html( this.headerView.render().el );
			this.$footer.html( this.footerView.el );
		},


		navToPage: function( pageId ) {
			//relative nav -- get correct pageID
			if(pageId === this.PAGE_BACKWARD) {
				if(this.curPageId === this.PAGE_CHARMS) {
					pageId = CB.buildData.get('form').get('charmHolder') ? this.PAGE_HOLDER : this.PAGE_FORM;

				} else if(this.curPageId === this.PAGE_HOLDER) {
					pageId = this.PAGE_FORM;

				} else {
					throw new Error('invalid backward navigation')
				}
			}

			this.beforeNav( pageId );
		},


		beforeNav: function( pageId ) {
			if(this.curPageId) {
				// transition out current page then render next
				this.$page.velocity(
					{
						opacity: 0
					},
					{
						duration: Config.TRANSITION_DUR,
						complete: _.bind(this.renderPage, this, pageId)
					}
				);

			} else {
				//go straight to render
				this.renderPage( pageId );
			}
		},


		renderPage: function( pageId ) {
			var pageView;

			switch(pageId) {
				case this.PAGE_LANDING:
					if(!this.landingView) {
						this.landingView = new PageLandingView;
					}
					pageView = this.landingView;

					this.headerView.hide();
				break;

				case this.PAGE_FORM:
					if(!this.formView) {
						this.formView = new PageFormView({
							collection: this.formsData
						});
					}
					pageView = this.formView;

					this.headerView.show(false, false);
				break;

				case this.PAGE_HOLDER:
					if(!this.holderView) {
						this.holderView = new PageHolderView({
							collection: this.formsData
						});
					}
					pageView = this.holderView;
					//performs some state management
					pageView.render();

					// this.headerView.show(true, false);
					this.headerView.show(false, false);
				break;

				case this.PAGE_CHARMS:
					//TODO: if the buildData hasn't changed, don't re-instantiate
					pageView = new PageCharmsView({
						collection: this.charmsData
					});

					this.headerView.show(true, true);
				break;

				default:
					// console.log("?? NAV PAGE ID", pageId);
			}

			//footer appear on certain pages only
			(pageId === this.PAGE_LANDING || pageId === this.PAGE_FORM) ? this.footerView.hide() : this.footerView.show();

			this.curPageId = pageId;

			//hacky little thing for special page classes
			$('body').removeClass().addClass(pageId);

			pageView.delegateEvents();

			this.$page.html( pageView.el );

			this.afterNav();
		},


		afterNav: function() {
			// transition in
			this.$page.velocity({opacity: 1},{duration: Config.TRANSITION_DUR});
			//request a resize
			ImagesLoaded(this.$page, _.bind(this.doResizePage, this));
		},


		showModal: function( contentId ) {
			this.$modal.html( this.modalView.render(contentId).el );
			this.$modal.addClass('active');
			this.modalView.delegateEvents();
		},

		hideModal: function() {
			this.$modal.addClass('faded');
			//after fade, sets it as hidden
			var self = this;
			setTimeout(function() {
				self.$modal
					.removeClass('active')
					.removeClass('faded')
					.html('');
			}, 500);
		},


		doRestart: function() {
			//TODO: make sure we're not causing mem leaks
			//views that otherwise get reused upon nav'ing to them
			this.formView = this.holderView = null;
			this.buildData = new BuildModel;

			this.initUi();
			this.navToPage(this.PAGE_FORM);
		},

		doResizePage: function () {
			var sendHeightReq = function() {
				var pageHeight = this.$page.outerHeight() + this.$footer.outerHeight();
				// console.log('=== RESIZE PAGE ====');
				// console.log('=== ', pageHeight );
				// console.log('====================');
				this.sendPostMessage('height:' + String(pageHeight) );
			}
			// .. it helps. go with it.
			_.delay( _.bind(sendHeightReq, this), 250);
		},

		doCheckout: function() {
			this.showModal(ModalView.CHECKOUT);

			var prodIds = CB.buildData.getCartProductEcommIds().join(',');
            this.sendPostMessage('checkout:' + prodIds);
		},

        gotoMagentoCart: function() {
            this.sendPostMessage('gotoCart:');
        },

        gotoIppoHomepage: function() {
            this.sendPostMessage('gotoHomepage:');
        },


		onCheckoutComplete: function() {
			//show success message in existing modal. provides links, doesn't fade away.
			this.modalView.render( ModalView.CHECKOUT_SUCCESS );
		},

		onCheckoutError: function() {
			this.modalView.render( ModalView.CHECKOUT_ERROR );
			_.delay(_.bind(this.hideModal, this), 5000);
		},


		/**
		 * Knowing that IE can only accept strings to postMessage() ... thanks a lot, IE
		 */
		sendPostMessage: function(str) {
			if(typeof str !== 'string') {
				str = String(str);
				// console.warn('WARN: passed postMessage a non-string param - try casting: ', str);
			}
			window.parent.postMessage(str, "*");
		},

		onPostMessageRecvd: function(event) {
			// String messages we might get from builder-embed.js
			if(typeof event.data === "string") {
				var msg = event.data;
				if(msg === "cb:checkout:success") {
					this.onCheckoutComplete();

				} else if(msg === 'cb:checkout:error') {
					this.onCheckoutError();
				}
			}
		}
	});

	return CBApp;
});
