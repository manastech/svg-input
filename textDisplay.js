function TextDisplay() {
	var ns = "http://www.w3.org/2000/svg";
	this.svg = document.createElementNS(ns,"svg");
	this.background = document.createElementNS(ns,"rect");
	this.setAttributesTo({
		width:100,
		height:100,
		style:"fill:#ff6600"
	}, this.background);
	this.svg.appendChild(this.background);
}

TextDisplay.prototype.setFocus = function(value) {
	this.setAttributesTo({style:"fill:#ff6600;stroke-width:" + (value? 3 : 0) + ";stroke:rgb(0,0,0)"}, this.background);
}

TextDisplay.prototype.setSize = function(width, height) {
	this.setAttributesTo({width:width, height:height}, this.svg);
}

TextDisplay.prototype.setAttributesTo = function(attributes, target) {
	for (var key in attributes) {
		target.setAttribute(key, attributes[key]);
	};
}