var bullseyeLocator = (function ($) {
	//Variables to modify
    var absoluteUrl = ''; //If you want to reference images/pages from another site, add the URL here between the quotes. Otherwise, leave it blank.
	var bullseyeApiKey = 'afbcb0bc-bb6b-4af4-8c48-c6b93bb733d2'; //Retrieve this from the Bullseye Admin
	var bullseyeClientId = '1091'; //Retrieve this from the Bullseye Admin
    var displayLocName = true; //Display the name of the location in the banner
	var displayPhone = true; //Display the phone number of the location in the banner
    var imagesDir = 'images'; //Directory where you will put the images. We provide an icon by default. You can also use your own. Final path will start with the "absoluteUrl" + "imagesDir".
    var linkToLocalLocator =  'http://www.bullseyelocations.com/pages/DemoInterface'; //Add a link to your locator page. 
	var locationTerm = 'store'; //Change if your locations are termed different than store such as dealer, restaurant, location, etc.
	var searchRadius = '25'; //Can be any number
	
	
	//Do not modify
	var bullseyeWsUrl = 'http://leadmanagerws.electricvine.com';
	var headerDivId = 'bullseye-banner-header';
    var headerInnerDivId = 'bullseye-banner-header-inner';
    var headerLoaderId = 'bullseye-banner-header-loader';
    var headerNoStoreId = 'bullseye-banner-header-no-store';
    var headerNearestStoreId = 'bullseye-banner-header-nearest-store';
    var beSrchCookieKey = "beloc_srchdata";

	
    function buildUrl(lat, lon) {
        var lat, lon;
        var url = bullseyeWsUrl + '/RestSearch.svc/DoSearch2?ClientId=' + bullseyeClientId + '&ApiKey=' + bullseyeApiKey + '&Latitude=' + lat + '&Longitude=' + lon + '&radius=' + searchRadius + '&StartIndex=0&PageSize=1';
        return url;
    }

    function buildLocationHtml(id, locName, address, city, state, zip, phone) {
        var headerNearestStore = $('<div/>', { id: headerNearestStoreId }).appendTo($('#' + headerInnerDivId));
        var headerMapLinkHref = linkToLocalLocator;

        $('<img/>', {
            src: absoluteUrl + imagesDir + '/map-icon.png',
            alt: 'Nearest ' + locationTerm
        }).appendTo(headerNearestStore);

        $(headerNearestStore).append('<p>Your nearest ' + locationTerm + ' is:</p>');       

        var addressTag = $('<address/>');
        var addressHtml = address + "<br/>" + city + " " + state + " " + zip;

        if(locName != "" && displayLocName == true) {
            addressHtml = "<span class='bullseye-banner-header-locname'>" + locName + "</span>" + addressHtml;
        } 

        if(phone != "" && displayPhone == true) {
            addressHtml = addressHtml + "<span class='bullseye-banner-header-phone'>" + phone + "</span>";
        }

        $(addressTag).append(addressHtml).appendTo(headerNearestStore);

        $($('#' + headerLoaderId)).hide();
        $($('#' + headerNoStoreId)).hide();
        $($('#' + headerNearestStoreId)).show();
		
		$('#' + headerInnerDivId).click(function() {
			location.href = linkToLocalLocator;
		});
    }

    function showDefaultMessage() {
        var noStoreDiv = $('<div/>', { id: headerNoStoreId }).appendTo($('div#' + headerInnerDivId));
        $(noStoreDiv).append('<p>We could not locate a ' + locationTerm + ' near you.</p>');
        $('<a/>', {
            href: linkToLocalLocator,
            text: 'Visit locator'
        }).appendTo(noStoreDiv);

        $($('#' + headerLoaderId)).hide();
        $($('#' + headerNearestStoreId)).hide();
        $($('#' + headerNoStoreId)).show();
    }

    function getCookie (key) {
        var name = key + "=";
        var ca = document.cookie.split(';');
        for(var i=0; i<ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0)==' ') c = c.substring(1);
            if (c.indexOf(name) == 0) return c.substring(name.length,c.length);
        }
        return "";
    }

    function setCookie (key, value, expMins) {
        var d = new Date();
        d.setTime(d.getTime() + (expMins*60*1000));
        var expires = "expires="+d.toUTCString();
        document.cookie = key + "=" + value + "; " + expires;
    }  


    return {
        getLocation: function () {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                                function (position) {
                                    lat = position.coords.latitude;
                                    lon = position.coords.longitude;

                                    var wsurl = buildUrl(lat, lon);

                                    $.getJSON(wsurl + "&callback=ResultList", function (data) { })
                                        .fail(function () {
                                            showDefaultMessage();
                                        })
                                        .done(function (data) {
                                            if (data.ResultList.length > 0) {
                                                var locationId = data.ResultList[0].Id != null ? data.ResultList[0].Id : "";
                                                var locName = data.ResultList[0].Name != null ? data.ResultList[0].Name : ""; 
												var address = data.ResultList[0].Address1 != null ? data.ResultList[0].Address1 : "";
                                                var city = data.ResultList[0].City != null ? data.ResultList[0].City : "";
                                                var state = data.ResultList[0].State != null ? data.ResultList[0].State : "";
                                                var zip = data.ResultList[0].PostCode != null ? data.ResultList[0].PostCode : "";
												var phone =  data.ResultList[0].PhoneNumber != null ? data.ResultList[0].PhoneNumber : "";
                                                var dataValStr = locationId  + '|' + locName + '|' + address + '|' + city + '|' + state + '|' + zip + '|' + phone;
                                                buildLocationHtml(locationId, locName, address, city, state, zip, phone);

                                                setCookie(beSrchCookieKey, dataValStr, 60);
                                            }
                                            else {
                                                showDefaultMessage();
                                            }
                                        });
                                },
                                function (error) {
                                    alert("Please enable your location or search using the locator.");
                                    showDefaultMessage();
                                }
                            );
            } else {
                alert("Please enable your location or search using the locator.");
                showDefaultMessage();
            }
        },
        buildBaseHtml: function () {
            var headerInnerDiv = $('<div/>', { id: headerInnerDivId }).appendTo($('#' + headerDivId));
            $('<img/>', {
                id: headerLoaderId,
                src: absoluteUrl + imagesDir + '/ajax-loader.gif',
                alt: 'loading...'
            }).appendTo(headerInnerDiv);
        },
        hasSearchCookie: function () {
            var hasCookie;
            var beSrchCookie = getCookie(beSrchCookieKey);

            if (beSrchCookie!="") {
                hasCookie = true;
                var beSrchCookieArr = beSrchCookie.split('|');
                buildLocationHtml(beSrchCookieArr[0], beSrchCookieArr[1], beSrchCookieArr[2], beSrchCookieArr[3], beSrchCookieArr[4], beSrchCookieArr[5], beSrchCookieArr[6]);
            }
            else
                hasCookie = false;

            return hasCookie;
        }
    }
} (jQuery));

$(function () {
    bullseyeLocator.buildBaseHtml();

    if(bullseyeLocator.hasSearchCookie() == false) {
        bullseyeLocator.getLocation();
    }
});