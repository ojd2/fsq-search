/**
 * Model Wrapper: Coffee Finder via Foursquare API
 */
var dataModel = (function dataModel(dataObj) {
    'use strict';
    // Sender is the context of the Model or View which originates the event
    dataObj._Event = function dataObjEvent(sender) {
        this._sender = sender;
        this._listeners = [];
    };
    dataObj._Event.prototype = {
        // add listener closures to the list
        attach(listener) {
            this._listeners.push(listener);
        },
        // loop through, calling attached listeners
        notify(args) {
            this._listeners.forEach(
                (v, i) => this._listeners[i](this._sender, args))
        },
    };
    return dataObj;
})(dataModel || {});

/**
 * Model module
 */
var dataModel = (function dataModel(dataObj) {
    'use strict';
    dataObj.Model = function dataObjModel(data) {
        this._data = data;
        this.onSet = new dataObj._Event(this);
    };
    // Define getters & setters:
    dataObj.Model.prototype = {
        // Get value:
        get() {
            return this._data;
        },
        // Sets the value & notifies any event listeners:
        set(data) {
            this._data = data;
            this.onSet.notify({
                data: data
            });
        },
    };
    return dataObj;
})(dataModel || {});

/**
 * Results View:
 */
var dataModel = (function dataModel(dataObj) {
    'use strict';
    dataObj.resultsView = function dataObjresultsView(model, selector) {
        this._model = model;
        this._selector = selector;
        // Attach model listeners:
        this._model.onSet.attach(
            () => this.show());
    };
    dataObj.resultsView.prototype = {
        show() {
            // Update model:	
            this._selector.innerHTML = this._model.get();
            // Call getLatLong():
            var term = this._selector.innerHTML.toString();
            getLatLong(term);
        },
    };

    function getLatLong(term) {
        // Retrieve coordinates using Geocoding API.
        var latitude = "";
        var longitude = "";
        var latlong = "";
        // Except term:
        if (term != "") {
        	var _term = term.trim();
            var theUrl = 'https://maps.googleapis.com/maps/api/geocode/json?address=' + _term + ',GB';
            console.log(theUrl);
            $.get(theUrl, function(data) {
                // Except results:
                if (data["results"].length > 0 && data["status"] == "OK") {
                    latitude = data["results"][0]["geometry"]["location"]["lat"].toFixed(2);
                    longitude = data["results"][0]["geometry"]["location"]["lng"].toFixed(2);
                    latlong = latitude + ',' + longitude;
                    // Except latlong:
                    if (latlong.length > 0) {
                        console.log(latlong);
                        getForSqrCoffee(latlong);
                    }
                } else {
                   $('#results').empty();
                   $('#dataList').empty();
               	   var error = $('<h2>Sorry, no matches found!</h2>');
                   $('#dataList').append(error);
                }
            });
        }
    };

    function getForSqrCoffee(latlong) {
        var client_id = "ST14CB5SZWRASXVYBZ03HELQG5NZZHJ0VYQGMSVEX4YRQOII";
        var client_secret = "UEXNXQX51VAB3FLMKKNHGTQ41AQNB52VDAR4H5BDW4VW4P3F";
        var core_url = "https://api.foursquare.com/v2/venues/search?categoryId=4bf58dd8d48988d1e0931735&radius=5000&intent=checkin&ll=";
        var main_url = core_url + latlong + '&client_id=' + client_id + '&client_secret=' + client_secret + '&v=20181402&limit=50';
        console.log(main_url);
        $.get(main_url, function(data) {
            if (data) {
            	 // Push results into []
        		// Sort by popularity
        		// Display in results area via function:
                console.log(data["response"]["venues"]);
                var dataString = JSON.stringify(data["response"]["venues"]);
                console.log(dataString);
                var dataObject = JSON.parse(dataString);
                $('#results').empty();
                $('#dataList').empty();
                var title = '<p>Coffee Shops found nearby Postal Code:</p>';
            	$('#results').append(title);
                var listItemString = $('#listItem').html();
                dataObject.forEach(buildNewList);

                function buildNewList(item, index) {
                    console.log(item);
                    var listItem = $('<li>' + listItemString + '</li>');
                    var listItemTitle = $('.title', listItem);
                    listItemTitle.html(item.name);
                    var listItemLocation = $('.location', listItem);
                    listItemLocation.html(item.location.address);
                    $('#dataList').append(listItem);
                }
            } else {
                $('#dataList').empty();
                var error = $('<h2>Sorry, no matches found!</h2>');
                $('#dataList').append(error);
            }
        });
    };
    return dataObj;
})(dataModel || {});

/**
 * Search Extract:
 */
var dataModel = (function dataModel(dataObj) {
    'use strict';
    // Input is a DOM element that supports .onChanged and .value
    dataObj.searchExtract = function dataObjsearchExtract(model, selector) {
        this._model = model;
        this._selector = selector;
        // For 2-way binding
        this.onChanged = new dataObj._Event(this);
        // Attach model listeners
        this._model.onSet.attach(
            () => this.show());
        // Attach change listener for two-way binding
        this._selector.addEventListener("change", e => this.onChanged.notify(e.target.value));
    };
    dataObj.searchExtract.prototype = {
        show() {
            this._selector.value = this._model.get();
        },
    };
    return dataObj;
})(dataModel || {});

/**
 * Controller module
 */
var dataModel = (function dataModel(dataObj) {
    'use strict';
    dataObj.Controller = function dataObjController(model, view) {
        this._model = model;
        this._view = view;
        if (this._view.hasOwnProperty('onChanged')) {
            this._view.onChanged.attach(
                (sender, data) => this.update(data)
            );
        }
        else {
        	$('#results').empty();
        	$('#dataList').empty();
            console.log("Empty input!");
        }
    };
    dataObj.Controller.prototype = {
        update(data) {
            this._model.set(data);
        },
    };
    return dataObj;
})(dataModel || {});

/**
 * Main JS:
 */
var main = function() {
    // Before everything:
    // Set model:
    var model = new dataModel.Model(),
    // Two way view on search bar:
    searchView = new dataModel.searchExtract(model, document.getElementById('searchBar')),
    searchController = new dataModel.Controller(model, searchView),
    // One way view on output:
    resultsView = new dataModel.resultsView(model, document.getElementById('postalCode')),
    resultsController = new dataModel.Controller(model, resultsView);
    // Set timer to refresh model:
    window.setTimeout(
        () => model.set(""), 10);
};

// On DOM load:
document.addEventListener('DOMContentLoaded', main, false);