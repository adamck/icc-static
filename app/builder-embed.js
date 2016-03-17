var CB_IFRAME_ID = "cb_iframe";
var CB_IFRAME_URL = "http://charms.ippolita.com";


function embedIframe() {
	//NOTE: height set here will be the height of the "100%" height landing page.
	var embed_str =
		'<iframe id="'+CB_IFRAME_ID+'" allowfullscreen="true" scrolling="no" marginheight="0" marginwidth="0" frameborder="0" '+
		'src="' + CB_IFRAME_URL + '"'+
		'height="768" style="width:100% !important;" ></iframe>';

	document.write(embed_str);
}
embedIframe();


// postMessage listener
var cb_onPostMessage = function (event) {
    var CHECKOUT        = 'checkout:',
        IFRAME_HEIGHT   = 'height:',
        GOTO_CART       = 'gotoCart:';
        GOTO_HOME       = 'gotoHomepage:';

	// three types of postMessage events, all string because ... IE
	if(typeof event.data === "string") {
		var msg = event.data;

		if(msg.indexOf(CHECKOUT) === 0) {
			msg = msg.substr(9, msg.length);
			//comma separated IDs
			var prodIds = msg.split(',')
			addProds(prodIds, 0, addProds);

		} else if(msg.indexOf(IFRAME_HEIGHT) === 0) {
			msg = msg.substr(7, msg.length);
			//scroll page/iframe to top
			window.scroll(0,0);
			//resize
			document.getElementById(CB_IFRAME_ID).style.height = msg+"px";

		} else if(msg === GOTO_CART) {
            window.location.href = "/checkout/cart";

        } else if(msg === GOTO_HOME) {
            window.location.href = "/";
        }
	}
}

if (window.addEventListener) {
	addEventListener("message", cb_onPostMessage, false);
} else {
	attachEvent("onmessage", cb_onPostMessage);
}


/**
 * Recursive method to add an array of products to the cart. Start with index = 0
 * @param prodIds Array of Magento product IDs
 * @param index Current recursive index
 */
var addProds = function(prodIds, index, callback) {
	// Protoype exists on the Magento page -- hooray
	if(!index) index = 0;

	var prodId = prodIds[index];
	// super_attribute is "one size" value
	var request = '/checkout/cart/add?product=' + prodId + '&qty=1&super_attribute[176]=315';

	new Ajax.Request(request, {
		method:'post',
		onSuccess: function(transport) {
		    // console.log('Magento: /checkout/cart/add/ ', prodId, 'Success!', index);
		    if(index === prodIds.length-1) {
		    	// ALL DONE - post message back to iframe reporting completion
		    	postAddCartComplete( prodIds.length );
		    	return;
		    }
		    if(callback) {
				callback.apply(window, [prodIds, index+1, callback]);
		    }
		},
		onFailure: function() {
		  	postAddCartError();
		}
	});
}


var sendMsgToIframe = function(msg) {
	//note 'contentWindow'
	var iframe = document.getElementById( CB_IFRAME_ID ).contentWindow;
	iframe.postMessage(msg, CB_IFRAME_URL);
}


var postAddCartComplete = function( numProdsAdded ) {
	sendMsgToIframe( 'cb:checkout:success' );
	//fake an AJAX Cart update - they use $j as a jquery alias
	var cnt = parseInt($j('#cart_cnt_num').html()) + numProdsAdded;
	$j('#cart_cnt_num').html( cnt );
	//remove dropdown since we can't use it
	$j('#cart_contents').remove();
}


var postAddCartError = function() {
	sendMsgToIframe( 'cb:checkout:error' );
}

