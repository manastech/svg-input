function TextDisplay() {

	const NS = "http://www.w3.org/2000/svg";
	var self = this;
	var _background = document.createElementNS(NS,"rect");
	var _container = document.createElementNS(NS,"rect");
	var _svg = document.createElementNS(NS,"svg");
	_svg.appendChild(_background);
	_svg.appendChild(_container);

	self.setData = function(value) {
		while (_container.firstChild) {
		    _container.removeChild(_container.firstChild);
		}
		var runs = value.scan(/(\S+|\s+)/g);
		console.log(runs)
		var text =  document.createElementNS(NS,"text");
	}

	self.setFocus = function(value) {
		setAttributesTo({style:"fill:#dddddd;stroke-width:" + (value? 2 : 0) + ";stroke:rgb(0,0,0)"}, _background);
	}

	self.setSize = function(width, height) {
		console.log(width, height)
		setAttributesTo({width:width, height:height}, _background);
	}

	function setAttributesTo(attributes, target) {
		for (var key in attributes) {
			target.setAttribute(key, attributes[key]);
		};
	}

	self.setFocus(false);
	self.svg = _svg;
}

String.prototype.scan = function (regex) {
	if (!regex.global) throw "Scan Error";
		var self = this;
		var match, occurrences = [];
	while (match = regex.exec(self)) {
		match.shift();
		occurrences.push(match[0]);
	}
	return occurrences;
};