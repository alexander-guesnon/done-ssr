var DefineMap = require("can-define/map/map");

module.exports = DefineMap.extend({
	seal: false
}, {
	page: "string",
	statusMessage: "string",
	throwError: function() {
		throw Error('Something went wrong');
	},
	location: function(){
		return location.pathname;
	},
	docLocation: function(){
		return document.location.pathname;
	}
});
