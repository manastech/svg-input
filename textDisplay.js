
function TextDisplay() {

	EventDispatcher.call(this);

	var NS = "http://www.w3.org/2000/svg";
	var NBSP = "\u00A0";
	var ZWSP = "\u200B";
	var BLOCK = "\u2588";
	var self = this;
	var _data = "";
	var _width = 300;
	var _height = 100;
	var _margin = 5;
	var _background;
	var _container;
	var _svg;
	var _selection;
	var _IBeam;
	var _IBeamInterval;
	var _focus;
	var _lines;
	var _words;
	var _chars;
	var _fontMeasures = [];
	var _wordMeasures = [];

	//drag text cursor
	//scroll
	//autoscroll

	//prototype.move, prototype.offset, prototype.position
	//remove wordMeasures, wordBounds, gc (use lastChar position + charMeasur) bublechanges, update line word char
	//remove unnecesary getBBox
	//predefined lineHeight

	//appendCharAt
	//removeCharAt
	//crossbrowser

	function init() {
		_svg = document.createElementNS(NS,"svg");
		_svg.addEventListener("click", clickHandler);
		_background = _svg.appendChild(document.createElementNS(NS,"rect"));
		_selection = _svg.appendChild(document.createElementNS(NS,"g"));
		_container = _svg.appendChild(document.createElementNS(NS,"g"));
		_IBeam = document.createElementNS(NS,"rect");
		_IBeam.setAttributes({width:1, style:"fill:#000000;"});
		_selection.setAtt
		self.setFocus(false);
		self.svg = _svg;
		garbageCollector();
	}

	self.setText = function(value) {
		_data = value;
		update();
	}

	/*self.appendChar = function(char) {
		char = char.replace(/ /g, NBSP);
		var empty = !_data.length;
		if(empty) {
			clear();
		}
		_data = (_data || "") + char;
		var string = _data;
		var word = string.scan(/(\S+|\s+)/g).lastElement();
		var newWord = word.length == 1;
		var lineNode, wordNode, wordBounds, charBounds, dx, transform;
		if(newWord) {
			dx = 0;
			if(empty) {
				x = _margin;
				y = _margin;
			} else {
				wordBounds = _words.lastElement().node.getBBox();
				transform = getTransform(_words.lastElement().node.firstChild.firstChild);
				x = transform.x + wordBounds.width;
				y = transform.y;
			}
			wordNode = _container.appendChild(document.createElementNS(NS, "g"));
			_words.push({node:wordNode, chars:[]});
		} else {
			wordNode =  _words.lastElement().node;
			wordBounds = wordNode.getBBox();
			dx = wordBounds.width;
			transform = getTransform(wordNode.firstChild.firstChild);
			x = transform.x;
			y = transform.y;
		}
		wrapper = wordNode.appendChild(document.createElementNS(NS, "g"));
		charNode = wrapper.appendChild(document.createElementNS(NS, "text"));
		charNode.textContent = char;
		charNode.setAttributes({
			class: "char",
			x: dx,
			"alignment-baseline": "hanging"
		});
		charBounds = charNode.getBBox();
		_chars.push(wrapper);
		_words.lastElement().chars.push(charNode);
		var newLine = x + charBounds.width > _width || empty;
		var wrap = newLine && !newWord && !empty;
		if(newLine) {
			var chars = [];
			if(wrap) {
				var length = _lines.lastElement().words.lastElement().length;
				var start = _lines.lastElement().chars.length - length;
				chars = _lines.lastElement().chars.splice(start, length);
				_lines.lastElement().words.remove(wordNode);
			}
			chars.push(wrapper);
			lineNode = _container.appendChild(document.createElementNS(NS, "g"));
			_lines.push({node:lineNode, words:[wordNode], chars:chars});
			x = _margin;
			y += empty? 0 : charBounds.height;
		} else {
			lineNode = _lines.lastElement().node;
			_lines.lastElement().chars.push(wrapper);
		}
		lineNode.appendChild(wordNode);
		charNode.setAttributes({
			"data-char":_chars.lastIndex(),
			"data-word":_words.lastIndex(),
			"data-line":_lines.lastIndex(),
			transform:"translate(" + x + "," + y + ")"
		});
		_fontMeasures[char] = _fontMeasures[char] || charBounds.width;
		_wordMeasures[word] = wordNode.getBBox();
	}*/

	self.setCaret = function (value) {
		var bounds = _chars[Math.max(0, Math.min(_chars.length - 1, value))].getBBox();
		_IBeam.setAttributes({x:bounds.x + (value == _chars.length? bounds.width : 0), y:bounds.y, height:bounds.height});
		setIBeam(true);
	}

	self.getCaretPosition = function() {
		return {x:Number(_IBeam.getAttribute("x")), y:Number(_IBeam.getAttribute("y")) + self.getLineHeight() / 2};
	}

	self.getLineHeight = function() {
		var lineBounds = _lines.firstElement().node.getBBox();
		return lineBounds.height;
	}

	self.setSelection = function() {
		while(_selection.firstChild) {
			_selection.removeChild(_selection.firstChild);
		}
		_chars.forEach(function (char) {
			char.firstChild.setAttributes({style:"fill:#000000"});
		});
		if(!arguments.length || arguments[0] == arguments[1]) return;
		var from = Math.min(arguments[0], arguments[1]);
		var to = Math.max(arguments[0], arguments[1]);
		var path = _selection.appendChild(document.createElementNS(NS, "path"));
		path.setAttributes({d:getPath(from, to), fill:"#0066ff"});
		for (var index = from; index < to && index < _chars.length; index++) {
			_chars[index].firstChild.setAttributes({style:"fill:#ffffff"});
		}
		setIBeam(false);
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

	self.getNearestCaretPosition = function(point, contour) {
		if(!_data.length) return {position:0, insertBefore:false};
		var position, charNode, charBounds, lineBounds;
		var insertBefore = false;
		var dataChar;
		var containerBounds = _container.getBBox();
		var before = point.y <= containerBounds.y;
		var after = point.y > containerBounds.y + containerBounds.height;
		if(before) {
			charNode = getNearestCharInLine(_lines.firstElement(), point.x);
		} else if (after) {
			charNode = getNearestCharInLine(_lines.lastElement(), point.x);
		} else {
			_lines.every(function (line) {
				lineBounds = line.node.getBBox();
				var match = point.y > lineBounds.y && point.y <= lineBounds.y + lineBounds.height ;
				if (match) {
					if(contour) {
						charNode = point.x < lineBounds.x? line.chars.firstElement() : line.chars.lastElement();
						insertBefore = charNode == line.chars.lastElement() && line != _lines.lastElement();
					} else {
						charNode = getNearestCharInLine(line, point.x);
					}
				}
				return charNode == undefined;
			});
		}
		charBounds = charNode.getBBox();
		dataChar = charNode.firstChild.getAttribute("data-char");
		position = Number(dataChar) + (point.x > (charBounds.x + charBounds.width / 2)? 1 : 0);
		return {position:position, insertBefore:insertBefore};
	}

	function getNearestCharInLine(line, x) {
		var charNode;
		line.chars.every(function (char) {
			var charBounds = char.getBBox();
			if(x < charBounds.x || x < charBounds.x + charBounds.width || char == line.chars.lastElement()) {
				charNode = char;
			}
			return charNode == undefined;
		});
		return charNode;
	}

	function getPath() {
		var from = Math.max(0,  Math.min(arguments[0], arguments[1]));
		var to = Math.min(_chars.length - 1, Math.max(arguments[0], arguments[1]));
		var end = arguments[0] == _chars.length || arguments[1] == _chars.length;
		var fromBounds = _chars[from].getBBox();
		var toBounds = _chars[to].getBBox();
		var range = [Number(_chars[from].firstChild.getAttribute("data-line")), Number(_chars[to].firstChild.getAttribute("data-line"))];
		var path = ""; 
		for (var index = range[0]; index <= range[1]; index++) {
			var line = _lines[index].node;
			var bounds = line.getBBox();
			var rect = {left:bounds.x, top:bounds.y, right:bounds.x + bounds.width, bottom:bounds.y + bounds.height};
			if(index == range[0]) {
				rect.left = fromBounds.x;
			}
			if(index == range[1]) {
				rect.right = toBounds.x + (end? toBounds.width : 0);
			}
			rect.left = Math.round(rect.left);
			rect.top = Math.round(rect.top);
			rect.right = Math.round(rect.right);
			rect.bottom = Math.round(rect.bottom);
			path += "M" + rect.left + " " + rect.top;
			path += "L" + rect.right + " " + rect.top;
			path += "L" + rect.right + " " + rect.bottom;
			path += "L" + rect.left + " " + rect.bottom + "Z";
		}
		return path;
	}

	function clear() {
		while (_container.firstChild) {
		    _container.removeChild(_container.firstChild);
		}
		_lines = [];
		_words = [];
		_chars = [];
	}

	function update() {
		clear();
		var string = _data || NBSP;
		var words = string.scan(/(\S+|\s+)/g);
		var chars, dx, x, y, lineNode, wordNode, wordCharNodes, charNode, wrapper;
		words.forEach(function(word) {
			wordNode = _container.appendChild(document.createElementNS(NS, "g"));
			wordCharNodes = [];
			word = word.replace(/ /g, NBSP);
			chars = word.split("");
			dx = 0;
			chars.forEach(function(char) {
				wrapper = wordNode.appendChild(document.createElementNS(NS, "g"));
				charNode = wrapper.appendChild(document.createElementNS(NS, "text"));
				charNode.textContent = char;
				charNode.setAttributes({
					x: dx,
					class: "char",
					"data-char":_chars.length,
					"data-word":_words.length
				});
				wordCharNodes.push(wrapper);
				_chars.push(wrapper);
				_fontMeasures[char] = _fontMeasures[char] || charNode.getBBox().width;
				dx += _fontMeasures[char];
			});
			_wordMeasures[word] = _wordMeasures[word] || wordNode.getBBox();
			var wordBounds = _wordMeasures[word];
			if(lineNode == undefined || (x + wordBounds.width > _width - _margin * 2 && !word.match(NBSP))) {
				x = _margin;
				y = _lines.length? y + wordBounds.height : _margin;
				lineNode = _container.appendChild(document.createElementNS(NS, "g"));
				_lines.push({node:lineNode, words:[], chars:[]});
			}
			lineNode.appendChild(wordNode);
			wordCharNodes.forEach(function(charNode) {
				charNode.firstChild.setAttributes({
					"data-line":_lines.length - 1,
					x:x + Number(charNode.firstChild.getAttributes().x),
					y:y
				});
			});
			_words.push({node:wordNode, chars:wordCharNodes});
			_lines.lastElement().chars = _lines.lastElement().chars.concat(wordCharNodes);
			_lines.lastElement().words.push(wordNode);
			x += wordBounds.width;
		});
		_background.setAttributes({width:_width, height:_height});
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


	function garbageCollector() {
		var persist = [];
		_data.scan(/(\S+|\s+)/g).forEach(function (word) {
			persist[word] = true;
		});
		for (var key in _wordMeasures) {
			if(_wordMeasures.hasOwnProperty(key)) {
				if(!persist[key]) {
					delete _wordMeasures[key];
				}
			}
		};
		window.setTimeout(garbageCollector, 1000);
	}

	function clickHandler(e) {
		var mouse = getMouseCoordinates(e);
		var caret, position;
		var dataChar = e.target.getAttribute("data-char");
		if(dataChar != undefined) {
			charNode = _chars[dataChar];
			charBounds = charNode.getBBox();
			position = Number(dataChar) + (mouse.x > (charBounds.x + charBounds.width / 2)? 1 : 0);
		} else {
			caret = self.getNearestCaretPosition(mouse, true);
			position = caret.position - (caret.insertBefore? 1 : 0);
		}
		self.setCaret(position);
		self.setSelection();
		self.dispatchEvent(new Event(Event.CARET, position));
	}

	init();
}