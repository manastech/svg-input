
function TextDisplay() {

	EventDispatcher.call(this);

	const NS = "http://www.w3.org/2000/svg";
	const NBSP = "\u00A0";
	const ZWSP = "\u200B";
	const BLOCK = "\u2588";
	var self = this;
	var _data = "";
	var _width = 100;
	var _height = 100;
	var _margin = 5;
	var _background;
	var _container;
	var _svg;
	var _IBeam;
	var _IBeamInterval;
	var _focus;
	var _lines;
	var _words;
	var _chars;

	//on click set caret position
	//Arrow up/down find near char (selection)
	//page up/down caret first position scroll (selection)
	//set selection
	//drag text cursor
	//caret width for selection color blue and blend mode difference
	//if empty set caret 0
	//separate prototypes
	//first word in line too long skip return

	function init() {
		_svg = document.createElementNS(NS,"svg");
		_svg.addEventListener("click", clickHandler);
		_background = _svg.appendChild(document.createElementNS(NS,"rect"));
		_container = _svg.appendChild(document.createElementNS(NS,"g"));
		_IBeam = document.createElementNS(NS,"rect");
		_IBeam.setAttributes({width:1, style:"fill:#000000;"});
		self.setFocus(false);
		self.svg = _svg;
	}

	self.setData = function(value) {
		_data = value;
		update();
	}

	self.setCaret = function (value) {
		var bounds = _chars[Math.max(0, Math.min(_chars.length - 1, value))].getBBox();
		_IBeam.setAttributes({x:bounds.x + (value == _chars.length? bounds.width : 0), y:bounds.y, height:bounds.height});
		setIBeam(true);
	}

	self.setMargin = function(value) {
		_margin = value;
		update();
	}

	self.setSize = function(width, height) {
		_width = width;
		_height = height;
		update();
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
		_background.setAttributes({style:"fill:#dddddd;stroke-width:" + (value? 2 : 0) + ";stroke:rgb(0,0,0)"});
	}

	function update() {
		while (_container.firstChild) {
		    _container.removeChild(_container.firstChild);
		}
		var string = _data || NBSP;
		var words = string.scan(/(\S+|\s+)/g);
		var chars, position, x, y, lineNode, wordNode, wordCharNodes, charNode, wrapper;
		_lines = [];
		_words = [];
		_chars = [];
		words.forEach(function(word) {
			wordNode = _container.appendChild(document.createElementNS(NS, "g"));
			wordCharNodes = [];
			word = word.replace(/ /g, NBSP);
			chars = word.split("");
			position = 0;
			chars.forEach(function(char) {
				wrapper = wordNode.appendChild(document.createElementNS(NS, "g"));
				charNode = wrapper.appendChild(document.createElementNS(NS, "text"));
				charNode.textContent = char;
				charNode.setAttributes({
					class: "char",
					x: position,
					"alignment-baseline": "hanging",
					"data-line":_lines.length,
					"data-word":_words.length,
					"data-char":_chars.length
				});
				wordCharNodes.push(wrapper);
				_chars.push(wrapper);
				position += charNode.getBBox().width;
			});
			var wordBounds = wordNode.getBBox();
			if(lineNode == undefined || (x + wordBounds.width > _width - _margin * 2 && !word.match(NBSP))) {
				x = _margin;
				y = _lines.length? y + wordBounds.height : _margin;
				lineNode = _container.appendChild(document.createElementNS(NS, "g"));
				_lines.push({node:lineNode, words:[], chars:[]});
			}
			lineNode.appendChild(wordNode);
			wordCharNodes.forEach(function(charNode) {
				charNode.firstChild.setAttributes({
					transform:"translate(" + x + "," + y + ")",
					"data-line":_lines.length - 1,
				});
			});
			_words.push({node:wordNode, chars:wordCharNodes});
			_lines.lastElement().chars = _lines.lastElement().chars.concat(wordCharNodes);
			_lines.lastElement().words.push(wordNode);
			x += wordBounds.width;
		});
		_background.setAttributes({width:_width, height:_height});
	}

	function setAttributesTo(target, attributes) {
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

	/*
	function getSegments(rectangle) {
		var points = [
			{x:rectangle.x, y:rectangle.y},
			{x:rectangle.x + rectangle.width, y:rectangle.y},
			{x:rectangle.x + rectangle.width, y:rectangle.y + rectangle.height},
			{x:rectangle.x, y:rectangle.y + rectangle.height}
		]
		var segments = [
			{a:points[0], b:points[1]},
			{a:points[1], b:points[2]},
			{a:points[2], b:points[3]},
			{a:points[3], b:points[0]}
		]
		return segments;
	}

	function calculateShortestDistance(point, segment) {
		var numerator = (point.x - segment.a.x) * (segment.b.x - segment.a.x) + (point.y - segment.a.y) * (segment.b.y - segment.a.y);
		var denomenator = (segment.b.x - segment.a.x) * (segment.b.x - segment.a.x) + (segment.b.y - segment.a.y) * (segment.b.y - segment.a.y);
		var r = numerator / denomenator;
	    var s = ((segment.a.y - point.y) * (segment.b.x - segment.a.x) - (segment.a.x - point.x) * (segment.b.y - segment.a.y)) / denomenator;
	    var distance;
		if (r >= 0 && r <= 1) {
			distance = Math.abs(s) * Math.sqrt(denomenator);;
		} else {
			var distA = (point.x - segment.a.x) * (point.x - segment.a.x) + (point.y - segment.a.y) * (point.y - segment.a.y);
			var distB = (point.x - segment.b.x) * (point.x - segment.b.x) + (point.y - segment.b.x) * (point.y - segment.b.y);
			distance = Math.sqrt(Math.min(distA, distB));
		}
		return distance;
	}

	function findNearestChar(point) {
		var shortestDistance = Number.MAX_VALUE;
		var nearestChar;
		_chars.forEach(function (char) {
			var boundingBox = char.getBBox();
			var segments = getSegments(boundingBox);
			segments.forEach(function (segment) {
				var distance = calculateShortestDistance(point, segment);
				if(distance < shortestDistance) {
					shortestDistance = distance;
					nearestChar = char;
				}
			});
		});
		return nearestChar;
	}
	*/

	function findNearestCharInLine(x, chars) {
		var nearestChar;
		if(chars != undefined) {
			chars.every(function (char) {
				var bounds = char.getBBox();
				if(x < bounds.x || x < bounds.x + bounds.width || char == chars.lastElement()) {
					nearestChar = char;
				}
				return nearestChar == undefined;
			});
		}
		return nearestChar;
	}

	function getMouseCoordinates(e) {
		var mouse = {};
		if (e.pageX || e.pageY) { 
		  mouse.x = e.pageX;
		  mouse.y = e.pageY;
		} else { 
		  mouse.x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft; 
		  mouse.y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop; 
		} 
		mouse.x -= _svg.offsetLeft;
		mouse.y -= _svg.offsetTop;
		return mouse;
	}

	function clickHandler(e) {
		var mouse = getMouseCoordinates(e);
		var index = getNearestIndex(mouse);
		var index, charNode, bounds;
		var dataChar = e.target.getAttribute("data-char");
		if(dataChar != undefined) {
			charNode = _chars[dataChar];
			bounds = charNode.getBBox();
		} else {
			_lines.every(function (line) {
				bounds = line.node.getBBox();
				if(mouse.y < bounds.y) {
					charNode = findNearestCharInLine(mouse.x, line.chars);
					bounds = charNode.getBBox();
				} else if (mouse.y < bounds.y + bounds.height) {
					charNode = mouse.x < bounds.x? line.chars.firstElement() : line.chars.lastElement();
					bounds = undefined;
				} else if (line == _lines.lastElement()) {
					charNode = findNearestCharInLine(mouse.x, line.chars);
					bounds = charNode.getBBox();
				}
				return charNode == undefined;
			});
			if(charNode == undefined) {
				charNode = _chars.firstElement();
			}
			dataChar = charNode.firstChild.getAttribute("data-char");
		}
		index = Number(dataChar);
		if(bounds != undefined && _data.length) {
			index += mouse.x > (bounds.x + bounds.width / 2)? 1 : 0;
		}
		self.dispatchEvent(new Event(Event.CARET, index));
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

Element.prototype.setAttributes = function(attributes) {
	for (var key in attributes) {
		this.setAttribute(key, attributes[key]);
	};
}

Element.prototype.getAttributes = function() {
	var attributes = {};
	for (var key in this) {
		attributes[key] = this.getAttribute(key);
	};
	return attributes;
}

Array.prototype.firstElement = function() {
    return this[0];
}

Array.prototype.lastElement = function() {
    return this[this.length - 1];
}