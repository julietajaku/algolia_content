'use strict';
/* global instantsearch */

var getTemplateByID = function(ID){
  return document.getElementById(ID).innerHTML.toString();
}

var $viewCoaches = $('#hits-coaches'),
    $viewCoachesPackages = $('#hits-coaches-packages'),
    $templateViewOption = $('.template-view-option');

$templateViewOption.on('click', function(){
  $viewCoaches.toggleClass('hide');
  $viewCoachesPackages.toggleClass('hide');
})

var highlightShortValue = function(hightlightResult, letter_padding){
    var letterPadding = letter_padding | 50,
    stringValue = hightlightResult,
    startIndex, endIndex, startString, endString;

  startIndex = Math.max( stringValue.indexOf('<em>') - letterPadding, 0 );
  endIndex = Math.min( stringValue.lastIndexOf('</em>') + letterPadding, stringValue.length );

  startString =  ( startIndex > 0 ) ? '... ' : '';
  endString = ( endString !== stringValue.length ) ? ' ...' : '';

  return startString + stringValue.substring(startIndex, endIndex) + endString;

}

var transformDataHits = function(hit){
  // console.log(hit);

  if(hit._highlightResult && hit._highlightResult.bio.matchedWords.length > 0){
    hit.bio_short = highlightShortValue(hit._highlightResult.bio.value)
  }else if(hit.bio){
    hit.bio_short = hit.bio.substr(0, 200) + '...';
  }

  if(hit.reviews){
    hit.review_percentage = 'style=width:' + (hit.reviews.average / 5) * 100 + '%;';
  }

  if(hit.packages){
    hit.package_count = hit.packages.length;
    var startPrice;

    for(var i = 0, l = hit.package_count; i < l; i++){
      //Finds the lowest package price
      if(startPrice == undefined){
        startPrice = hit.packages[i].price;
      }else{
        startPrice = Math.min(startPrice, hit.packages[i].price);
      }
    }
    hit.package_starting_price = startPrice;
  }

  //Shorten the package description
  if(hit._highlightResult && hit._highlightResult.packages){

    var highlightPackages = hit._highlightResult.packages.sort(function(a,b){
      return  b.description.matchedWords.length - a.description.matchedWords.length;
    });

    for(var ii = 0, ll = highlightPackages.length; ii < ll; ii++){
      if(ii >= 3){
        hit._highlightResult.packages = highlightPackages.splice(0,3);
        break;
      }
      if(highlightPackages[ii].description.matchedWords.length > 0){
        highlightPackages[ii].desc_short = highlightShortValue(highlightPackages[ii].description.value, 30)

      }else if(highlightPackages[ii].description.value){
        highlightPackages[ii].desc_short = highlightPackages[ii].description.value.substr(0, 100) + '...';
      }

      highlightPackages[ii].package_title.value = highlightPackages[ii].package_title.value.toLowerCase();
    }
  }


  //Converts the distance
  if(hit._rankingInfo.matchedGeoLocation){
  	hit.distance_calculate = Math.round(hit._rankingInfo.matchedGeoLocation.distance * 0.000621371);
  }

  return hit;
}



var search = instantsearch({
  appId: 'YORNOA2EPS',
  apiKey: '6f2b9a275341d6961c799a2981b9d663',
  indexName: 'coach_packages',
  searchParameters: {
    getRankingInfo: true,
  }
});

search.addWidget(
  instantsearch.widgets.searchBox({
    container: '#q',
    placeholder: 'Search by name or interest'
  })
);

search.addWidget(
  instantsearch.widgets.stats({
    container: '#search-results',
    templates: {
    	body: function(data){
    		if(data.query){
    			return data.nbHits + ' results found for <em>' + data.query + '<em>';
    		}
 			return '';
    	}
    }
  })
);


var hitTemplate =
  '<article class="hit">' +
    '<div class="coach-picture" style="background-image:url({{imagepath}});"></div>' +
    '<div class="coach-desc">' +
      '<div class="coach-fullname"><a href="{{URL}}" target="_blank">{{{_highlightResult.firstname.value}}} {{{_highlightResult.lastname.value}}}</a></div>' +
      '<div class="coach-title">{{{_highlightResult.title.value}}}</div>' +
      '<div class="coach-location">{{city}}, {{state}}</div>' +
    '</div>' +
      /*'<div class="content-descrption">{{#stars}}<span class="ais-star-rating--star{{^.}}__empty{{/.}}"></span>{{/stars}}</div>' +*/
  '</article>';

var noResultsTemplate =
  '<div class="text-center">No results found matching <strong>{{query}}</strong>.</div>';

var menuTemplate =
  '<a href="javascript:void(0);" class="facet-item {{#isRefined}}active{{/isRefined}}"><span class="facet-name"><i class="fa fa-angle-right"></i> {{name}}</span class="facet-name"></a>';

var facetTemplateCheckbox =
  '<a href="javascript:void(0);" class="facet-item">' +
    '<input type="checkbox" class="{{cssClasses.checkbox}}" value="{{name}}" {{#isRefined}}checked{{/isRefined}} />{{name}}' +
    '<span class="facet-count">({{count}})</span>' +
  '</a>';

search.addWidget(
  instantsearch.widgets.hits({
    container: '#hits-coaches',
    hitsPerPage: 15,
    highlightPreTag: "<em>",
    highlightPostTag: "</em>",
    templates: {
      empty: noResultsTemplate,
      item: getTemplateByID('template-hit-coach')
    },
    transformData: transformDataHits
  })
);

//
search.addWidget(
  instantsearch.widgets.hits({
    container: '#hits-coaches-packages',
    hitsPerPage: 15,
    highlightPreTag: "<em>",
    highlightPostTag: "</em>",
    templates: {
      empty: noResultsTemplate,
      item: getTemplateByID('template-hit-coach-and-packages')
    },
    transformData: transformDataHits
  })
);


search.addWidget(
  instantsearch.widgets.pagination({
    container: '#pagination',
    cssClasses: {
      active: 'active'
    },
    labels: {
      previous: '<i class="fa fa-angle-left fa-2x"></i> Previous page',
      next: 'Next page <i class="fa fa-angle-right fa-2x"></i>'
    },
    showFirstLast: false
  })
);

search.addWidget(
  instantsearch.widgets.refinementList({
    container: '#type',
    attributeName: 'packages.session_type',
    limit: 20,
    cssClasses: {
      root: 'checkbox',
      list: 'list-group',
      item: 'list-group-item',
      active: 'active'
    }
  })
);

search.addWidget(
  instantsearch.widgets.refinementList({
    container: '#method',
    attributeName: 'packages.methods',
    limit: 20,
    cssClasses: {
      root: 'checkbox',
      list: 'list-group',
      item: 'list-group-item',
      active: 'active'
    }
  })
);


search.addWidget(
  instantsearch.widgets.refinementList({
    container: '#gender',
    attributeName: 'gender',
    limit: 20,
    cssClasses: {
      root: 'checkbox',
      list: 'list-group',
      item: 'list-group-item',
      active: 'active'
    }
  })
);

search.addWidget(
  instantsearch.widgets.starRating({
    container: '#averagerating',
    attributeName: 'reviews.average',
    max: 5,
    labels: {
      andUp: ''
    },
    templates: {
    	// item: function(data){
    	// 	console.log(data);
    	// 	return 'item';
    	// }
    }
  })
);

search.addWidget(
  instantsearch.widgets.refinementList({
    container: '#specialties',
    attributeName: 'packages.specialties',
    limit: 20,
    cssClasses: {
      root: 'checkbox',
      list: 'list-group',
      item: 'list-group-item',
      active: 'active'
    }
  })
);

search.addWidget(
  instantsearch.widgets.hierarchicalMenu({
    container: '#location',
    attributes: ['state', 'citystate'],
    sortBy: ['name:asc'],
    limit: 50,
    templates: {
      item: menuTemplate
    }
  })
);

search.addWidget(
  instantsearch.widgets.priceRanges({
    container: '#price',
    attributeName: 'packages.price',
    cssClasses: {
      list: 'list-group',
      item: 'list-group-item',
      count: 'badge pull-right',
      active: 'active'
    },
    templates: {

    }
  })
);

search.addWidget(
  instantsearch.widgets.rangeSlider({
    container: '#numberofsessions',
    attributeName: 'packages.numberofsessions',
  })
);

search.addWidget(
  instantsearch.widgets.sortBySelector({
    container: '#sort-by-selector',
    indices: [
      {name: 'coach_packages', label: 'Default'},
      {name: 'coach_packages_price_asc', label: 'Price High to Low'},
      {name: 'coach_packages_price_desc', label: 'Price Low to High'},
      {name: 'coach_packages_ratings_desc', label: 'Ratings High to Low'},
      {name: 'coach_packages_ratings_asc', label: 'Ratings Low to High'}
    ],
    label:'sort by'
  })
);


search.addWidget(
  instantsearch.widgets.clearAll({
    container: '#clear-all',
    templates: {
      link: '<i class="fa fa-eraser"></i> Clear all filters'
    },
    cssClasses: {
      root: 'btn btn-block btn-default'
    },
    autoHideContainer: true
  })
);

search.addWidget(
  instantsearch.widgets.currentRefinedValues({
    container: '#current-filters',
    clearAll: 'after',
    templates: {
      item: function(data){
      	var s;

      	if(data.count == undefined){
      		s = '<span class="glyphicon glyphicon-remove" aria-hidden="true"></span> ' + data.name ;
      	}else{
				s = '<span class="glyphicon glyphicon-remove" aria-hidden="true"></span> ' +
				data.name + ' <span class="ais-current-refined-values--count"> (' + data.count + ')</span>';
      	}

      	return s;
      },
      clearAll: function(){
        var s = '<span class="glyphicon glyphicon-remove" aria-hidden="true"></span> Clear All';
        return s;
      }
    },
    cssClasses: {
      link: 'label label-default',
      clearAll: 'label label-danger'
    }

  })
);


instantsearch.widgets.distanceSort = function distanceSort(options) {
	var previousState = false, optionValue, incomingFromCB = false, foundLocationText, userLocation;

	function renderZipInput(helper){
		optionValue = $('aside input[value="In Person"]').prop('checked');

		var optionInPersonValue = $('aside input[value="In Person"]').parents().eq(2),
			inputTemplate = '<div class="list-group-item in-person-input-area"><div class="input-group"> <input type="text" class="form-control"  disabled placeholder="Zip Code" title="Select the \'In Person\' Option First" maxlength="5">  <span class="glyphicon glyphicon-exclamation-sign form-control-feedback" aria-hidden="true"></span> </div> </div>',
			$oldZipInputValue = $('.in-person-input-area input').val(),
			currentInputValue,
			$newZipInput;

		// Remove old one
		$('.in-person-input-area').remove();

		// Place new one
		optionInPersonValue.after(inputTemplate);

		// Capture new input
		$newZipInput = $('.in-person-input-area').find('input');

		$newZipInput.on('input propertychange', function(e){
			var self = $(this),
				val = self.val().toString();

			if(val.length == 5 && !isNaN(val)){

     			$.getJSON('http://maps.googleapis.com/maps/api/geocode/json?address='+ val +'&sensor=true', function(data){
     				userLocation.google_zip = val;
     				foundLocationText = userLocation.google_zip;
     				userLocation.coords.latitude = data.results[0].geometry.location.lat;
     				userLocation.coords.longitude = data.results[0].geometry.location.lng;
        			incomingFromCB = true;

        			helper.setQueryParameter('aroundLatLng', userLocation.coords.latitude + ', ' + userLocation.coords.longitude).search();

     			}).fail(function(){

     			});
			}else{
				self.parent().addClass('has-error');
			}
		});

		// If In Person is checked and there's been a changed
		if(optionValue && optionValue != previousState){

			// Add active class
			$('.in-person-input-area').addClass('active')

			if (navigator.geolocation && userLocation == undefined) {
				// if geolocation is possible and the user location hasn't been found
				$newZipInput.val( 'Locating' );

				var mainBody = $('#main-body');
					mainBody.addClass('loading-init');

				setTimeout(function(){
					mainBody.addClass('loading-started');
				}, 10)

				var valInterval =  setInterval(function(){
					if( $newZipInput.val().length < 12 ){
						$newZipInput.val( $newZipInput.val( ) + '.' );
					}else{
						$newZipInput.val( 'Locating' );
					}

				}, 300);

        		navigator.geolocation.getCurrentPosition(function (pos) {
        			userLocation = {
        				coords: {
        					latitude : pos.coords.latitude,
        					longitude : pos.coords.longitude
        				}
        			};

        			$.getJSON('http://maps.googleapis.com/maps/api/geocode/json?latlng='+  pos.coords.latitude + ',' + pos.coords.longitude +'&sensor=true', function(data){

        				clearInterval(valInterval);

						mainBody.removeClass('loading-started');
						setTimeout(function(){
							mainBody.removeClass('loading-init');
						}, 500);

        				userLocation.google_zip = data.results[1].address_components[6].long_name;
        				foundLocationText = userLocation.google_zip;
	        			incomingFromCB = true;

	        			helper.setQueryParameter('aroundLatLng', pos.coords.latitude + ', ' + pos.coords.longitude).search();

        			}).fail(function(){

        			});

        		}, function(err){
        			clearInterval(valInterval);

					mainBody.removeClass('loading-started');
					setTimeout(function(){
						mainBody.removeClass('loading-init');
					}, 500);

        			foundLocationText = 'Nearest to You';
        			incomingFromCB = true;

        			userLocation = {
        				coords: {}
        			};

        			helper.setQueryParameter('aroundLatLngViaIP', true).search();
        		});

        	} else if(userLocation){
        		// If user location is already store just use it

				foundLocationText = userLocation.google_zip;
     			incomingFromCB = true;

     			helper.setQueryParameter('aroundLatLng', userLocation.coords.latitude + ', ' + userLocation.coords.longitude).search();

			}else{
				// If no geolocation is possible
     			foundLocationText = 'Nearest to You';
     			incomingFromCB = true;

     			helper.setQueryParameter('aroundLatLngViaIP', true).search();
			}
		}else if(incomingFromCB){
			// Incoming from CB

			// Rest incomingFromCB
			incomingFromCB = false

			// Add active class
			$('.in-person-input-area').addClass('active')

			$newZipInput.removeAttr('disabled').val(foundLocationText)

		}else if(optionValue && optionValue == previousState){

			$('.in-person-input-area').addClass('active')

			$newZipInput.removeAttr('disabled').val(foundLocationText)

		}else if(optionValue != previousState){
			// Off
			helper.setQueryParameter('aroundLatLngViaIP', undefined).setQueryParameter('aroundLatLng', undefined).search();
		}

		previousState = optionValue;

	}

  return {
    render: function(params) {
    	renderZipInput(params.helper);
    }
  }
}

search.addWidget(
 instantsearch.widgets.distanceSort()
);



search.start();