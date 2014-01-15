
function TextDisplay() {

	const NS = "http://www.w3.org/2000/svg";
	const NBSP = "\u00a0";
	//const NBSP = "\u2588";
	var self = this;
	var _width;
	var _height;
	var _background;
	var _container;
	var _svg;
	var _IBeam;
	var _IBeamInterval;
	var _focus;
	

	//on click set caret position
	//Arrow up/down find near char (selection)
	//page up/down caret first position scroll (selection)
	//set selection

	function init() {
		_background = document.createElementNS(NS,"rect");
		_container = document.createElementNS(NS,"g");
		_svg = document.createElementNS(NS,"svg");
		_svg.appendChild(_background);
		_svg.appendChild(_container);
		_IBeam = document.createElementNS(NS,"rect");
		setAttributesTo({width:1, style:"fill:#000000;"}, _IBeam);
		self.setFocus(false);
		self.svg = _svg;
	}

	self.setData = function(value) {
		while (_container.firstChild) {
		    _container.removeChild(_container.firstChild);
		}
		var runs = value.scan(/(\S+|\s+)/g);
		var x = 0;
		var y = 12;
		runs.forEach(function(entry) {
			entry = entry.replace(/ /g, NBSP);
			var text = document.createElementNS(NS,"text");
			text.textContent = entry;
			setAttributesTo({
				"pointer-events":"none",
				"font-family":"Arial",
				"text-rendering":"geometricPrecision",
				style:"font-size:15px;fill:#000000"
			}, text);
			_container.appendChild(text);
			var bounds = text.getBBox();
			if(x + bounds.width > _width && !entry.match(NBSP)) {
				x = 0;
				y += bounds.height;
			}
			setAttributesTo({x:x, y:y}, text);
			x += bounds.width;
		});
	}

	self.setCaret = function (value) {
		var position = 0;
		var bounds;
		$(_container).children().each(function (index, entry) {
			if(position + entry.textContent.length == value) {
				bounds = entry.getBBox();
			} else if (position + entry.textContent.length > value) {
				var clone = entry.cloneNode(true);
				clone.textContent = clone.textContent.substring(0, value - position);
				_container.appendChild(clone);
				bounds = clone.getBBox();
				_container.removeChild(clone);
			}
			if(bounds != undefined) {
				setAttributesTo({x:bounds.x + bounds.width, y:bounds.y, height:bounds.height}, _IBeam);
				return false;
			}
			position += entry.textContent.length;
		});
		setIBeam(true);
	}

	self.setFocus = function(value) {
		_focus = value;
		setIBeam(_focus);
		if(_focus) {
			_container.appendChild(_IBeam);
		} else {
			if(_IBeam.parentNode) {
				_container.removeChild(_IBeam);
			}
		}
		setAttributesTo({style:"fill:#dddddd;stroke-width:" + (value? 2 : 0) + ";stroke:rgb(0,0,0)"}, _background);
	}

	self.setSize = function(width, height) {
		_width = width;
		_height = height;
		setAttributesTo({width:width, height:height}, _background);
	}

	function setAttributesTo(attributes, target) {
		for (var key in attributes) {
			target.setAttribute(key, attributes[key]);
		};
	}

	function toogleIBeam() {
		if(_IBeam.parentNode) {
			_container.removeChild(_IBeam);
		} else {
			_container.appendChild(_IBeam);
		}
	}

	function setIBeam(value) {
		window.clearInterval(_IBeamInterval);
		if(value && _focus) {
			_IBeamInterval = window.setInterval(toogleIBeam, 500);
			_container.appendChild(_IBeam);
		} else if(_IBeam.parentNode) {
			_container.removeChild(_IBeam);
		}
	}

	init();
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