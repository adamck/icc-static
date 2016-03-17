define([

], function() {

	var Events = {
		GOTO_PAGE_LANDING 	: 'page:landing',
		GOTO_PAGE_FORM 		: 'page:form',
		GOTO_PAGE_HOLDER 	: 'page:holder',
		GOTO_PAGE_CHARMS 	: 'page:charms',
		GOTO_BACK			: 'page:backward',
		RESTART				: 'action:restart',
		CHECKOUT			: 'action:checkout',
        GOTO_MAGENTO_CART   : 'action:gotocart',
        GOTO_IPPOLITA_HP    : 'action:gotohomepage',
		REQUEST_PAGE_RESIZE : 'action:resize',
		HIDE_MODAL 			: 'action:modal:hide',
		SHOW_CART_MODAL		: 'action:modal:show:cart',
		SHOW_SHARE_MODAL	: 'action:modal:show:share'
	};

	return Events;
})
