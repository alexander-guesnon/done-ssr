var Steal = require("steal");
var loadExtension = require("./load_extension");
var trigger = require("./trigger");

module.exports = function(cfg){
	var steal = Steal.clone();
	var loader = global.System = steal.System;

	loader.config({
		env: process.env.NODE_ENV === "production" ?
			"production,server": "server"
	});

	steal.config(cfg || {});

	// Ensure the extension is loaded before the main.
	loadExtension(loader);

	var startup = steal.startup().then(function(autorender){
		// startup returns an Array in dev
		autorender = Array.isArray(autorender) ? autorender[0] : autorender;
		return autorender.importPromise || Promise.resolve(autorender);
	});

	return function(url){
		return startup.then(function(autorender){
			var doc = new document.constructor;
			var ViewModel = autorender.viewModel;

			if(!ViewModel) {
				throw new Error("can-ssr cannot render your application without a viewModel defined. " +
								"See the guide for information. " +
								"http://donejs.com/Guide.html#section_Createatemplateandmainfile");
			}

			var state = new ViewModel();

			state.attr(can.route.deparam(url));
			state.attr("__renderingAssets", []);
			state.attr("@env", process.env);

			var render = autorender.render;
			return autorender.renderAsync(render, state, {}, doc)
				.then(function(){
					state.attr("__renderingComplete", true);
				}).then(function(result){
					var html = doc.body.innerHTML;

					// Cleanup the dom
					trigger(doc, "removed");

					return html;
				});
		});
	};
};