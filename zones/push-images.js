
module.exports = function(response, root){
	root = root || process.cwd();

	var domPatch = require("dom-patch");
	var fs = require("fs");
	var mime = require("mime-types");
	var url = require("url");

	return function(data){
		var images = new Set();
		var oldCreateElement;
		var document;

		function pushImage(img) {
			var mimeType = mime.lookup(img.src);
			if(mimeType) {
				var pushStream = response.push(img.src, {
					status: 200,
					method: "GET",
					request: { accept: "*/*" },
					response: {
						"content-type": mimeType
					}
				});

				// pushStream will be null if the response is closed.
				if(pushStream) {
					var path = url.parse(img.src).pathname;
					var sendStream = fs.createReadStream(root + path);
					sendStream.pipe(pushStream);
				}
			}
		}

		function onChanges(changes) {
			for(let img of images) {
				images.delete(img);
				pushImage(img);
			}
		}

		function documentCreateElement(tagName) {
			var element = oldCreateElement.apply(this, arguments);
			if(tagName.toLowerCase() === "img") {
				images.add(element);
			}
			return element;
		}

		return {
			created: function(){
				document = data.document;
				domPatch(document, onChanges);
			},
			beforeTask: function(){
				oldCreateElement = document.createElement;
				document.createElement = documentCreateElement;
			},
			afterTask: function(){
				document.createElement = oldCreateElement;
			},
			ended: function(){
				domPatch.unbind(document, onChanges);
			}
		};
	};
};
