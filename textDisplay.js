
function TextDisplay() {

	EventDispatcher.call(this);

	var self = this;
	var _width;
	var _height;
	var _computedWidth;
	var _computedHeight;
	var _fontSize;
	var _lineHeight;
	var _svg;
	var _textFlow;
	var _selectionArea;
	var _IBeam;
	var _IBeamInterval;
	var _focus;
	var _lines;
	var _elements = [];
	var _elementsWidth = [];

	//dispatch drag event
	//pill on drop update caret
	//caret got hidden
	//cant drag selection from first char
	//jump move caret with insertBefore?
	//click pills select
	//Pill hover active focus style
	//firefox font size
	//cascade changes

	function init() {
		_fontSize = fontSize("char");
		_lineHeight = _fontSize * 1.2;
		_svg = document.createElementNS("http://www.w3.org/2000/svg","svg");
		_selectionArea = _svg.appendChild(document.createElementNS("http://www.w3.org/2000/svg","g"));
		_selectionArea.setAttribute("fill", "#0066ff");
		_textFlow = _svg.appendChild(document.createElementNS("http://www.w3.org/2000/svg","g"));
		_IBeam = document.createElementNS("http://www.w3.org/2000/svg","rect");
		_IBeam.setAttribute("width", "1");
		_IBeam.setAttribute("style", "fill:#000000;");
		_IBeam.setAttribute("pointer-events", "none");
		self.focus(false);
	}

	self.width = function() {
		return _width;
	}

	self.height = function() {
		return _height;
	}

	self.computedWidth = function() {
		return _computedWidth;
	}

	self.computedHeight = function() {
		return _computedHeight;
	}

	self.source = function() {
		return _svg;
	}

	self.drawSelection = function(start, end) {
		self.clearSelection();
		_IBeam.setAttribute("opacity", "0");
		var path = _selectionArea.appendChild(document.createElementNS("http://www.w3.org/2000/svg", "path"));
		path.setAttribute("d", selectionPath(start, end));
		for (var index = start; index < end && index < _elements.length; index++) {
			_elements[index].focus(true);
		}
	}

	self.clearSelection = function() {
		while(_selectionArea.firstChild) {
			_selectionArea.removeChild(_selectionArea.firstChild);
		}
		_elements.forEach(function(element) {
			element.focus(false);
		});
		_IBeam.setAttribute("opacity", "1");
	}

	self.moveCaret = function (value) {
		var x = 0;
		var y = 0;
		if(_elements.length) {
			var element = _elements[Math.max(0, Math.min(_elements.lastIndex(), value))];
			x = element.x() + (value == _elements.length? _elementsWidth[element.text()] : 0);
			y = element.y() - _fontSize;
		}
		_IBeam.setAttribute("x", x || 0);
		_IBeam.setAttribute("y", y || 0);
		_IBeam.setAttribute("height", _lineHeight);
		setIBeam(true);
	}

	self.nearestPosition = function(point, contour) {
		var nearestPosition = {index:0, insertBefore:false};
		if(!_elements.length) return nearestPosition;
		function elementByLine(line, x) {
			for (var blockIndex = line.childElementCount - 1; blockIndex >= 0; blockIndex--) {
				block = line.childNodes[blockIndex];
				for (var elementIndex = block.childElementCount - 1; elementIndex >= 0; elementIndex--) {
					var element = block.childNodes[elementIndex];
					var index = Number(element.getAttribute("data-index"));
					var left = _elements[index].x();
					var right = left + _elementsWidth[_elements[index].text()];
					if(x > right || x > left || element == line.firstChild.firstChild) {
						return _elements[index];
					}
				}
			}
		}
		var before = point.y <= 0;
		var after = point.y > _elements.lastElement().y();
		if(before) {
			element = elementByLine(_textFlow.firstChild, point.x);
		} else if (after) {
			element = elementByLine(_textFlow.lastChild, point.x);
		} else {
			for (var index = _textFlow.childElementCount - 1; index >= 0; index--) {
				var line = _textFlow.childNodes[index];
				var top = index * _lineHeight;
				var bottom = top + _lineHeight;
				var match = point.y > top && point.y <= bottom;
				if (match) {
					if(contour) {
						element = _elements[(point.x < 0? line.firstChild.firstChild : line.lastChild.lastChild).getAttribute("data-index")];
					} else {
						element = elementByLine(line, point.x);
					}
					nearestPosition.insertBefore = element.source() == line.lastChild.lastChild && line != _textFlow.lastChild;
					break;
				}
			}
		}
		nearestPosition.index = _elements.indexOf(element) + (point.x > (element.x() + _elementsWidth[element.text()] / 2)? 1 : 0);
		return nearestPosition;
	}

	self.caretPosition = function() {
		return {x:Number(_IBeam.getAttribute("x")), y:Number(_IBeam.getAttribute("y")) + _fontSize};
	}

	self.focus = function(value) {
		_focus = value;
		setIBeam(_focus);
		if(_focus) {
			_svg.appendChild(_IBeam);
		} else {
			if(_IBeam.parentNode) {
				_svg.removeChild(_IBeam);
			}
		}
	}

	self.lineHeight = function() {
		return _lineHeight;
	}

	self.fontSize = function() {
		return _fontSize;
	}

	self.render = function(elements, width, height) {
		if(!arguments.length) {
			elements = _elements;
			width = _width;
			height = _height;
		}
		_computedWidth = 0;
		while (_textFlow.firstChild) {
		    _textFlow.removeChild(_textFlow.firstChild);
		}
		var line, block, blockElements, lastElement;
		var breakable = false;
		var x = 0;
		var y = 0;
		var index = 0;
		_lines = [];
		_elements = elements.concat(new Character("\u200B")) || [new Character("\u00A0")];
		_elements.forEach(function (element) {
			var boundary = block == undefined || element.text().match(/\s/) || lastElement.type() == "pill" || lastElement.text().match(/\s/);
			var overflow = x > width;
			breakable = breakable || (lastElement != undefined? lastElement.type() != "pill" && lastElement.text().match(/\s/) != null : false);
			if(line == undefined || (overflow && breakable)) {
				y = line == undefined? _fontSize : y + _lineHeight;
				breakable = false;
				line = _textFlow.appendChild(document.createElementNS("http://www.w3.org/2000/svg", "g"));
				line.setAttribute("data-index", _textFlow.childElementCount - 1);
				if(blockElements) {
					var offsetX = blockElements.firstElement().x();
					blockElements.forEach(function(blockElement) {
						blockElement.offset(-offsetX, _lineHeight);
					});
					line.appendChild(block);
					x -= offsetX;
				} else {
					x = 0;
				}
			}
			if(element.type() == "pill" || boundary) {
				blockElements = [];
				block = line.appendChild(document.createElementNS("http://www.w3.org/2000/svg", "g"));
			}
			blockElements.push(element);
			block.appendChild(element.source());
			if(_elementsWidth[element.text()] == undefined) {
				var boundingBox = element.draw();
				_elementsWidth[element.text()] = boundingBox.width;
				_lineHeight = _lineHeight || boundingBox.height;
			} else {
				element.draw(_elementsWidth[element.text()]);
			}
			element.move(x, y);
			element.index(index);
			x += _elementsWidth[element.text()];
			index++;
			if(lastElement != undefined && (lastElement.type() == "pill" || !lastElement.text().match(/\s/))) {
				_computedWidth = Math.max(_computedWidth, lastElement.x() + _elementsWidth[lastElement.text()]);
			}
			lastElement = element;
		});
		_computedWidth = Math.max(x, _computedWidth);
		_width = Math.max(_computedWidth, width);
		_computedHeight = y;
		_height = Math.max(_computedHeight, height);
	}

	function selectionPath(start, end) {
		var from = _elements[start];
		var to = _elements[end - 1];
		var range = [Number(from.source().parentNode.parentNode.getAttribute("data-index")), Number(to.source().parentNode.parentNode.getAttribute("data-index"))];
		var path = ""; 
		for (var index = range[0]; index <= range[1]; index++) {
			var line = _textFlow.childNodes[index];
			var last = _elements[line.lastChild.lastChild.getAttribute("data-index")];
			var rect = {left:0, top:0 + index * _lineHeight, right:last.x() + _elementsWidth[last.text()], bottom:(index + 1) * _lineHeight};
			if(index == range[0]) {
				rect.left = from.x();
			}
			if(index == range[1]) {
				rect.right = to.x() + _elementsWidth[to.text()];
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

	function toogleIBeam() {
		if(_IBeam.parentNode) {
			_svg.removeChild(_IBeam);
		} else {
			_svg.appendChild(_IBeam);
		}
	}

	function setIBeam(value) {
		window.clearInterval(_IBeamInterval);
		if(value && _focus) {
			_IBeamInterval = window.setInterval(toogleIBeam, 500);
			_svg.appendChild(_IBeam);
		} else if(_IBeam.parentNode) {
			_svg.removeChild(_IBeam);
		}
	}

	function fontSize(TextClass) {
		var text = document.body.appendChild(document.createElement("div"));
		text.setAttribute("class", TextClass);
		text.textContent = "X";
		var fontSize = window.getComputedStyle(text).getPropertyValue("font-size");
		document.body.removeChild(text);
		return Number(fontSize.match(/\d+/));
	}

	init();
}