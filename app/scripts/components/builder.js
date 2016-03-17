/*global define, CB*/

define([
    'jquery',
    'underscore',
    'backbone',
    'templates',
    'events',
    'utils',
    'views/dropdown_menu',
    'vendor/jquery-ui-1.10.4.custom',   //draggable and droppable
    'vendor/imagesloaded.pkgd',
    'vendor/goog-analytics',

    'vendor/jquery.ui.touch-punch',
    'vendor/jquery.rotate',

], function ($, _, Backbone, JST, Events, Utils, DropdownMenuView, Drag, ImagesLoaded, GA) {
    'use strict';

    var BuilderView = Backbone.View.extend({
        //TODO: get these from css values instead of hardcoded
        CHARM_W: 180,
        CHARM_H: 180,
        BRACELET_SLOT_W: 100,
        BRACELET_SLOT_H: 100,

        className: "builder-view",

        template:       JST['app/scripts/templates/builder.ejs'],
        charmsTmpl:     JST['app/scripts/templates/builder-charms.ejs'],
        tooltipTmpl:    JST['app/scripts/templates/builder-charms-tooltip.ejs'],
        braceletTmpl:   JST['app/scripts/templates/builder-form-bracelet.ejs'],
        necklaceTmpl:   JST['app/scripts/templates/builder-form-necklace.ejs'],
        holderTmpl:     JST['app/scripts/templates/builder-form-necklace-holder.ejs'],

        events: {
            "click .cat-menu li > a": "onCatClick",
            "click .charms-nav .nav > a": "onCharmNavClick"
        },


        init: function(charmsColl, formModel, holderModel) {
            // Remove those charms that are incompatible with the selected form or form/holder
            // console.log('charms', charmsColl.length)
            var formType = formModel.get('type');

            this.charmsModels = _.filter(charmsColl.models, function(charm) {

                if(holderModel || formModel.get('falseConstraint') === 'holder') {
                    // if there's a holder we just need to see that his charm has no holder constraint.
                    // 'falseConstraint' is used for necklace/holder combo products. the form is necklace but can receive only holder type charms
                    return (_.indexOf(charm.get('constraints'), 'holder') === -1);

                } else {
                    // console.log('  form okay?', (_.indexOf(charm.get('constraints'), formType) === -1))
                    // if no holder, see that the charm doesn't have a constraint on this form type (necklace or bracelet)
                    return (_.indexOf(charm.get('constraints'), formType) === -1);
                }

            });

            // array of objects {id, label}
            this.categories = this.parseCategories( this.charmsModels );
            // hash of category IDs to array of subcat IDs {id: []} if any exist
            this.subcats = this.parseSubCategories( this.charmsModels );

            //apply main template. only dynamic content is the main categories menu
            this.$el.html( this.template({
                "cats":     this.categories
            }));

            this.$win = $(window);
        	this.$form = this.$el.find('.form');
            this.$charms = this.$el.find('.charms');
            this.$charmsCont = this.$charms.children('.charms-cont');
            this.$catMenu = this.$el.find('.cat-menu');
            this.$subcatMenuEl = this.$el.find('.subcat-menu');
            this.$tooltipCont = this.$el.find('.tooltips');

            this.formModel = formModel;
            this.charmsColl = charmsColl;
            this.holderModel = holderModel;
            //used to determine from which model we should get necklace slot coordinates
            this.slotModel = holderModel ? holderModel : formModel;
            this.maxCharms = this.slotModel.getNumSlots();

            this.initForm();
            this.initCharms();

            //will adjust placed charms on resize
            $(window).resize( _.bind(this.onWinResize, this));
            this.onWinResize();
        },


        loadCharms: function(categoryId) {
            // get all the charms that fall under the spec'd category
            var catCharms = _.filter(this.charmsModels, function(cModel) {
                return cModel.get('cat')['id'] === categoryId
            });

            // apply em to the charms template
            this.$charms.find('.charms-inner').html(
                this.charmsTmpl({
                    charms: Utils.arrModelsToJSON( catCharms ),
                    getUid: _.bind(this.getNewCharmUid, this)
                })
            );

            // tooltip behavior
            this.$charms.find('.charm').hover(
                _.bind(this.onCharmOver, this),
                _.bind(this.onCharmOut, this)
            ).on('touchend', _.bind(this.onCharmOut, this));
        },


        onCharmOver: function(e) {
            var $c = $(e.currentTarget);
            //TODO: is this faster than compiling template once then using jqury to replace contents?
            this.$tooltipCont.addClass('active').html(
                this.tooltipTmpl({
                    name: $c.data('tooltipName'),
                    price: $c.data('tooltipPrice'),
                })
            );

            var $tooltip = this.$tooltipCont.children('.tooltip'),
                ttX = $c.offset().left - ($tooltip.outerWidth() - $c.outerWidth())/2,
                ttY = $c.offset().top - $tooltip.outerHeight() + 1; //border tweak.

            //position
            $tooltip.offset({left: ttX, top: ttY});
        },


        onCharmOut: function() {
            this.$tooltipCont.removeClass('active').html('');
        },


        initForm: function() {
            //get the right template and set aside useful els
            var formTmpl = this.isBracelet() ?
                this.braceletTmpl(this.formModel.toJSON()) : this.necklaceTmpl(this.formModel.toJSON());

            this.$form.append( formTmpl );
            this.$formImg = this.$form.find('.form-image');

            if(this.holderModel) {
                //add the charm holder image
                this.$formImg.after(this.holderTmpl(this.holderModel.toJSON()));
                this.$holderImg = this.$form.find('.holder-image');
            }

            //after the templates are written,
            // create the slot divs for bracelets -- necklaces just have two slots, already in the template
            if(this.isBracelet()) {
                var $slots = this.$form.find('.slots'),
                    self = this;

                _.each(this.formModel.get('slots'), function(slotObj, index) {
                    $slots.append( self.getNewBraceletSlotEl(slotObj, index) );
                });
            }

            //init droppable slots
            this.$form.find('.slot').droppable({
                activeClass: 'active',
                hoverClass: 'hovered',
                drop: _.bind(this.onCharmPlace, this)
            });
        },


    	initCharms: function() {
        	this.isDropSucc =
            this.isNewDrag = false;

            //load and select first category of charms
            var initCategory = this.categories[0].id;
            this.selectCategory( initCategory );
        	this.initDraggables();
		},


        initDraggables: function() {
            this.$el.find('.charm .charm-draggable.original').draggable({
                iframeFix: true,
                start: _.bind(this.onCharmDragStart, this),
                stop:  _.bind(this.onCharmDragEnd, this),
                helper: 'clone',
                appendTo: '.' + this.className,
                cursorAt: { top: this.CHARM_H/4 + 15, left: this.CHARM_W/4 + 6},
            }).css('position', 'absolute');    //modify default draggable behavior

            // if max charms placed, disable dragging more in
            if(this.hasMaxCharms()) {
                this.disableMenuCharms();
            }
        },


        selectCategory: function(catId) {
            //creates the markup for charms of this category, including all subcategories
            this.loadCharms(catId);

            var initSubCatId;
            if(this.subcats[catId].length) {
                //see if there are any subcats for this and pick the first one
                initSubCatId = this.subcats[catId][0].id;

                // IP-57
                initSubCatId = null;
            }

            //show the charms that fit this subcat if one exists, else all in this cat
            if(initSubCatId) {
                //create the subcategory dropdown
                // NOTE: IE8 HATES PARENS AND INSTANTION
                var menu = new DropdownMenuView({
                    collection: this.subcats[catId]
                });

                this.$subcatMenuEl.html( menu.render().el );
                Backbone.Events.on(DropdownMenuView.EVENT_SELECT, _.bind(this.selectSubCategory, this));
                this.showCharmsOfSubcat(initSubCatId);

            } else {
                this.$subcatMenuEl.html( '' );
                Backbone.Events.off(DropdownMenuView.EVENT_SELECT);
                this.showCharmsOfCat(catId);
            }

            this.initDraggables();
        },


        selectSubCategory: function(subCatId) {
            this.showCharmsOfSubcat(subCatId);
            //make sure newly shown charms in a subcat have correct state
            this.hasMaxCharms() ? this.disableMenuCharms() : this.enableMenuCharms();
        },


        showCharmsOfSubcat: function(subCatId) {
            this.$charms.find('.charm').removeClass('active');
            this.$charms.find('.charm.subcat-'+subCatId).addClass('active');
            this.fixSubCatTooltips(subCatId);
            this.refreshCharmsList();
        },


        showCharmsOfCat: function(catId) {
            this.$charms.find('.charm').removeClass('active');
            this.$charms.find('.charm.cat-'+catId).addClass('active');
            this.refreshCharmsList();
        },


        fixSubCatTooltips: function() {
            var $activeCharms = this.$charms.find('.charm.active');
            if($activeCharms.length > 0) {
                $activeCharms.first().find('.tooltip').addClass('offset-right');
                if($activeCharms.length > 1) {
                    $activeCharms.last().find('.tooltip').addClass('offset-left');
                }
            }
        },


        refreshCharmsList: function() {
            //with sizeCharmsCont, prevent awkward overflow before we know the full width
            this.$charmsCont.addClass('loading-charms');
            ImagesLoaded($(".charm.active"), _.bind(this.sizeCharmsCont, this));
        },


        sizeCharmsCont: function() {
            var charmWidth = this.$charms.find('.charm').outerWidth(true);
            var charmContainerWidth = charmWidth * this.$charms.find('.charm.active').length;
            this.$charmsCont.removeClass('loading-charms').scrollLeft(0);
            this.$charms.find('.charms-inner').width( charmContainerWidth );
        },


        onCatClick: function(e) {
            e.preventDefault();

            // selection state
            $(e.currentTarget).closest('ul').find('li').removeClass('active');
            $(e.currentTarget).closest('li').addClass('active');

            //show applicable charms
            var id = e.currentTarget.hash;
            id = id.slice(1,id.length);

            this.selectCategory(id);

            GA.trackEventValue('charm-category', 'click', 'click-charm-category-'+id);
        },


        onCharmNavClick: function(e) {
            e.preventDefault();
            $(e.currentTarget).closest('.nav').hasClass('next') ? this.scrollCharms(1) : this.scrollCharms(-1);
        },


        scrollCharms: function(dir) {
            // dir: -1 or 1
            if(dir !== -1 && dir !== 1) throw new Error('ya goofed');

            var charmWidth = this.$charms.find('.charm').outerWidth(true);
            var curLeft = this.$charmsCont.scrollLeft();

            this.$charmsCont.stop().animate({
                scrollLeft: curLeft + (charmWidth * 3 * dir)
            }, 250);
        },


        hasMaxCharms: function() {
            return (CB.buildData.getNumCharms() === this.maxCharms);
        },


        enableMenuCharms: function() {
            this.$charms.find('.charm.active').removeClass('disabled');
            try {
                this.$charms.find('.charm-draggable.original').draggable("enable");
            } catch(e) {
            }
        },


        disableMenuCharms: function() {
            this.$charms.find('.charm.active').addClass('disabled');
            try {
                this.$charms.find('.charm-draggable.original').draggable("disable");
            } catch(e) {
                //
            }
        },


        onCharmDragStart: function(e) {
            var $charm = $(e.target);

            //to let onCharmDragEnd know whether to replace the initial .draggable
            this.isNewDrag = !$charm.hasClass('placed');

        	$charm.removeClass('reset placed');
        },


        onCharmDragEnd: function(e) {
        	var $charm = $(e.target);

			if(!this.isDropSucc) {
				// charm was dropped outside of any valid position
				//	fade out and remove
                $charm = this.cloneCharmToForm( $charm );
				$charm
                    .css({
                        left: e.pageX - this.CHARM_W/4,
                        top: e.pageY - this.CHARM_H/4
                    })
                    .addClass('reset');

				_.delay(function() {
					$charm.remove();
				}, 500);

                //if we were at max charms, re-enable dragging
                if(this.hasMaxCharms()) {
                    this.enableMenuCharms();
                }

                //if this was a charm that'd been on a necklace, remove from the build
                if(!this.isNewDrag) {
                    CB.buildData.removeCharm( $charm.data('charmId') );

                    //if it was on a necklace, re-sort remaining charms
                    if(this.isNecklace()) {
                        this.resortNecklaceCharms( parseInt($charm.attr('data-slot-index')) );
                    }
                }
			}

            //regardless of success on the drop, need to create a new draggable in the charms menu
            if(this.isNewDrag) {
                this.createNewCharmDraggable( $charm.data('charmSku') );
            }

            // if max charms placed, disable dragging more in
            if(this.hasMaxCharms()) {
                this.disableMenuCharms();
            }

			this.isDropSucc =
            this.isNewDrag = false;
        },


        cloneCharmToForm: function($charm) {
            $charm.appendTo( this.$form );
            //get that newly appended charm ... um, easier way?
            $charm = this.$form.find('[data-charm-id="'+$charm.data('charmId')+'"]');
            return $charm;
        },


        resortNecklaceCharms: function( slotIndexOfRemoved ) {
            // iterate ".charm.placed", sort by data-slot-index,
            // then set charms to slot matching an index of a loop from 0 to charms.length - 1

            var charms = this.$el.find('.charm-draggable.placed');
            charms = _.sortBy(charms, function(c) {return parseInt($(c).attr('data-slot-index'));});

            var $charm,
                slotX,
                slotY,
                slotRot,
                slotIndex,
                slotCoords,
                sideIndex,
                charmSide,
                nextSlotIndex = slotIndexOfRemoved,
                imgPos = this.$holderImg ? this.$holderImg.position() : this.$formImg.position();

            for(var i=0; i<charms.length; i++) {
                $charm = $(charms[i]);

                slotIndex = parseInt($charm.attr('data-slot-index'));
                if(slotIndex < nextSlotIndex) {
                    // console.log('lower index than the one removed, continue.', i, slotIndex, nextSlotIndex)
                    continue;
                }

                charmSide = this.slotModel.getSlotCoordsByIndex( slotIndex ).side;
                slotCoords = this.slotModel.getSlotCoordsByIndex( nextSlotIndex );
                if(i > 0 && charmSide !== slotCoords.side) {
                    //though a lower index is available, it's on the opposite side. continue.
                    // console.log(i, ": lower index available", nextSlotIndex, slotIndex, 'but on difft side, charm:', charmSide);
                    continue;
                }

                //finally
                slotX = slotCoords.x + imgPos.left - this.CHARM_W/2;
                slotY = slotCoords.y + imgPos.top;
                if(this.$holderImg) {
                    //holder position correction
                    slotX -= this.$holderImg.width()/2;
                }
                slotRot = slotCoords.rot;

                //move charm to the slot we found
                this.setCharmPosition($charm, slotX, slotY, slotRot, nextSlotIndex);

                // TODO: refactor if time, this got really complicated.

                //  now update the build data.
                sideIndex = slotCoords.side ? this.slotModel.getSideIndexOfSlot(slotCoords) : undefined;
                CB.buildData.updateNecklaceCharm($charm.data('charmId'), nextSlotIndex, slotCoords.side, sideIndex);

                //now the slot index this charm had occupied is the next one available
                nextSlotIndex = slotIndex;
            }
        },


        /**
         * Triggered when a draggable charm is successfully dropped on a "droppable" area
         * Occurs before onCharmDragEnd ... cuz that's how draggable and droppable() work.
         */
        onCharmPlace: function(event, ui) {
        	//will tell onCharmDragEnd what to do with the charm
        	this.isDropSucc = true;

            var charm = ui.draggable;
            var slot = $(event.target);

            if(charm.hasClass('original')) {
                //to solve overflow:hidden problem with our pageable/scrollable charm menu
                // http://ccnmtl.columbia.edu/compiled/projects/clone_wars_jquery_ui_draggable.html
                charm = this.cloneCharmToForm( charm );

                var dropX = event.pageX - this.CHARM_W/4 - this.$form.offset().left;
                var dropY = event.pageY - this.CHARM_H/4 - this.$form.offset().top;

                //differentiate it from the original, and move to coords we dropped at
                charm
                    .css({
                        left: dropX,
                        top: dropY
                    })
                    .removeClass('original')
                    .draggable('option', 'helper', 'original');
            }

        	// move charm into place on the form
        	this.placeCharmInSlot( charm , slot );
        },


        placeCharmInSlot: function($charm, $slot) {
        	var id = $charm.data('charmId'),
                sku = String($charm.data('charmSku')),
        		slotX,
        		slotY,
                slotRot,
        		slotIndex,
        		slotCoords,
                charmModel = this.charmsColl.findWhere({sku: sku});

        	if(this.isBracelet()) {
                // Bracelet
                if($charm.data('slotIndex') !== undefined) {
                    //user took an already placed charm off the form and placed it in another valid slot
                    //remove from build and allow it to be re-added below
                    CB.buildData.removeCharm( id );
                }

                var formOffset = this.$formImg.position(),
                    charmCenterX = (this.CHARM_W/2 - this.BRACELET_SLOT_W/2),
                    charmCenterY = (this.CHARM_H/2 - this.BRACELET_SLOT_H/2);

                slotX       = formOffset.left + parseInt($slot.css('left')) - charmCenterX;
                slotY       = formOffset.top +  parseInt($slot.css('top'))  - charmCenterY;
                slotIndex   = $slot.data('slotIndex');
                slotRot     = $slot.data('slotRotation');

                CB.buildData.addCharm( charmModel, id, slotIndex );


        	} else {
        		// Necklace
                if($charm.data('slotIndex') !== undefined) {
                    //user took an already placed charm off the form and placed it in another valid slot
                    //for now just put it back to its original slot ... TODO: re-ordering, fill-in
                    $charm.addClass('placed');
                    this.setCharmToSavedSlot($charm);
                    return;
                }

                var necklaceSide = $slot.data('necklaceSide'),
                    sModel = this.slotModel,
                    imgPos = this.$holderImg ? this.$holderImg.position() : this.$formImg.position(),
                    sideIndex;

                if(CB.buildData.getNumCharms() === 0) {
                    //charm will go in the first slot, centered
                    slotIndex = 0;
                    slotCoords = sModel.getSlotCoordsByIndex( slotIndex );

                    //add w/out reference to a side
                    CB.buildData.addCharm( charmModel, id, slotIndex );

                } else {
                    sideIndex   = CB.buildData.getNextAvailableSlotCoordIndex( necklaceSide );
                    slotCoords  = sModel.getSlotCoordsBySide( necklaceSide, sideIndex );

                    if(!slotCoords) {
                        // no more slots on the chosen side. get next available from the other side or middle
                        var otherSide = necklaceSide === 'left' ? 'right' : 'left';

                        sideIndex  = CB.buildData.getNextAvailableSlotCoordIndex( otherSide );
                        slotCoords = sModel.getSlotCoordsBySide( otherSide, sideIndex );
                        necklaceSide = otherSide;
                        // console.log(' couldn not find, so', otherSide, sideIndex, slotCoords)

                        // NOTE: After reording algo is done, should never get here
                        if(!slotCoords) {
                            throw new Error( 'could not find any place for this charm - why is that?' );
                        }
                    }

                    slotIndex = sModel.getIndexOfSlot(slotCoords);

                    //add w reference to a side so getSlotCoordBySide works for next ones added
                    CB.buildData.addCharm( charmModel, id, slotIndex, necklaceSide, sideIndex );
                }

				slotX = slotCoords.x + imgPos.left - this.CHARM_W/2;
				slotY = slotCoords.y + imgPos.top;
                if(this.$holderImg) {
                    //holder position correction
                    slotX -= this.$holderImg.width()/2;
                }
                slotRot = slotCoords.rot;
        	}

            //IE8 garbage
            if(!Modernizr.canvas) {
                //IE8 can't rotate a div and also loses its reference to $charm
                $('[data-charm-id="'+id+'"] img').rotate(slotRot);
            }
            // ugh

            //place draggable charm in the correct position for this slot
            this.setCharmPosition($charm, slotX, slotY, slotRot, slotIndex);

            $charm.addClass('placed');
        },


        setCharmPosition: function($charm, slotX, slotY, slotRot, slotIndex) {
            // z-index: first charm slot (index 0, middle position for necklaces) is highest
            $charm
                .attr('data-slot-index', slotIndex)
                .attr('data-offset-top', slotY)
                .attr('data-offset-left', slotX)
                .attr('data-rotation', slotRot)
                .attr('data-form-w', this.$form.width())   //size of form canvas at time of placement
                .css('left', slotX)
                .css('top', slotY)
                .css('z-index', parseInt(this.maxCharms - slotIndex))
                .rotate(slotRot);
        },


        setCharmToSavedSlot: function($charm) {
            var slotY = $charm.data('offsetTop');
            var slotX = $charm.data('offsetLeft');
            var rot = $charm.data('rotation');
            $charm
                .css('left', slotX)
                .css('top', slotY)
                .rotate(rot);
        },


        createNewCharmDraggable: function( charmSku ) {
            //find the original .charm element and append a new draggable to it
            this.$charms.find('.charm[data-charm-sku="'+ charmSku +'"]').append( this.getNewDraggable(charmSku) );
            this.initDraggables();
        },


        getNewDraggable: function(charmSku) {
            var model = this.charmsColl.findWhere({sku: String(charmSku)});
            var thumbSrc = model.get('images').thumb;

            //TODO: templatize this and reuse out of builder.ejs
            var $d = $('<div>')
                .addClass('charm-draggable')
                .addClass('original')
                .attr('data-charm-sku', charmSku)
                .attr('data-charm-id', this.getNewCharmUid())
                .append( $('<img>').attr('src', thumbSrc) );

            return $d;
        },


        getNewBraceletSlotEl: function(slotObj, slotIndex) {
            var $slot = $('<div>').addClass('slot');
            $slot
                .attr('data-slot-index', slotIndex)
                .attr('data-slot-rotation', slotObj.rot)
                .offset({top: slotObj.y, left: slotObj.x - 25})     //slots coords were defined with narrower slots - need to take that into account
                .rotate(slotObj.rot);

            return $slot;
        },


        getNewCharmUid: function() {
            // good enough
            return Math.floor( Math.random()*0x1000000 );
        },


        getCharmTooltipClass: function( ttIndex, numCharms ) {
            return (ttIndex === 0) ? 'offset-right' : (ttIndex === numCharms-1) ? 'offset-left' : '';
        },


        isNecklace: function() {
            return this.formModel.get('type') === 'necklace';
        },


        isBracelet: function() {
            return this.formModel.get('type') === 'bracelet';
        },


        onWinResize: function() {
            // assume form is centered, so adjust x by half.  TODO: if there's vertical scaling, adjust that too
            var fw = $('.form').width(),
                l;

            this.$el.find('.charm-draggable.placed').each(function() {
                //initial x coord - change in form width halved
                l = $(this).data('offsetLeft') - ((parseInt($(this).data('formW')) - fw) / 2);
                $(this).css('left', l);
            });
        },


        parseSubCategories: function(charmsModels) {
            var subcats = {},
                cat,
                subcat;

            _.each(charmsModels, function(model) {
                cat     = model.get('cat');
                subcat  = model.get('subcat');

                if(subcats[cat.id]) {
                    if( subcat && subcat.id && !_.findWhere(subcats[cat.id], {id: subcat.id})) {
                        subcats[cat.id].push( {id: subcat.id, label: subcat.label} );
                    }
                } else {
                    if(subcat && subcat.id) {
                        subcats[cat.id] = [{id: subcat.id, label: subcat.label}];
                    } else {
                        subcats[cat.id] = [];
                    }
                }
            });

            return subcats;
        },


        parseCategories: function(charmsModels) {
            var cats = [],
                catIds = [],
                cat;
            _.each(charmsModels, function(model) {
                cat = model.get('cat');
                // if(catIds.indexOf(cat.id) < 0) {
                if(_.indexOf(catIds, cat.id) < 0) {
                    cats.push(cat);
                    catIds.push(cat.id);    //easy way to keep track of which cat objs have already been saved
                }
            });
            return cats;
        }
    });

    return BuilderView;
});
