
function TextDisplay() {

	EventDispatcher.call(this);

	var NS = "http://www.w3.org/2000/svg";
	var NBSP = "\u00A0";
	var ZWSP = "\u200B";
	var BLOCK = "\u2588";
	var self = this;
	var _width;
	var _height;
	var _margin;
	var _fontSize;
	var _lineHeight;
	var _wrapper;
	var _svg;
	var _textFlow;
	var _selectionArea;
	var _IBeam;
	var _IBeamInterval;
	var _focus;
	var _lines;
	var _blocks;
	var _elements = [];
	var _elementsWidth = [];

	//display draw/drawfrom (add width & height to div)
	//display.moveCaret

	//Pill hover active focus children pointer-events:none
	//create pill
	//drag pill
	//space + wordboundary (review select + trailing space)
	//one space per block
	
	//cascade changes, self.render data -line -block -char
	//autoexpand
	//firefox font size
	//remove pill (use button display none, display block)

	function init() {
		_fontSize = getFontSize("char");
		_lineHeight = _fontSize * 1.2;
		_wrapper = document.createElement("div");
		_wrapper.setAttribute("id","wrapper");
		_svg = _wrapper.appendChild(document.createElementNS(NS,"svg"));
		_selectionArea = _svg.appendChild(document.createElementNS(NS,"g"));
		_textFlow = _svg.appendChild(document.createElementNS(NS,"g"));
		_IBeam = document.createElementNS(NS,"rect");
		_IBeam.setAttribute("width", "1");
		_IBeam.setAttribute("style", "fill:#000000;");
		_IBeam.setAttribute("pointer-events", "none");
		self.margin(5);
		self.focus(false);
	}

	self.width = function() {
		return _width;
	}

	self.height = function() {
		return _height;
	}

	self.source = function() {
		return _wrapper;
	}

	self.drawSelection = function(start, end) {
		self.clearSelection();
		_IBeam.setAttribute("opacity", "0");
		var path = _selectionArea.appendChild(document.createElementNS(NS, "path"));
		path.setAttribute({d:getPath(start, end), fill:"#0066ff"});
		for (var index = from; index < to && index < _elements.length; index++) {
			_elements[index].focus(true);
		}
	}

	self.clearSelection = function() {
		while(_selectionArea.firstChild) {
			_selectionArea.removeChild(_selectionArea.firstChild);
		}
		_elements.forEach(function(char) {
			char.focus(false);
		});
		_IBeam.setAttribute("opacity", "1");
	}

	self.moveCaret = function (value) {
		var char = _elements[Math.max(0, Math.min(_elements.lastIndex(), value))];
		console.log(char, _elements.length)
		var x = char.x() + (value == _elements.length? _elementsWidth[char.text()] : 0);
		var y = char.y() - _fontSize;
		_IBeam.setAttribute("x", x);
		_IBeam.setAttribute("y", y);
		_IBeam.setAttribute("height", _lineHeight);
		setIBeam(true);
	}
	
	self.getNearestPosition = function(point, contour) {
		/*if(!_data.length) return {position:0, insertBefore:false};
		var position, charNode, dataChar, index;
		var insertBefore = false;
		var before = point.y <= _margin;
		var after = point.y > _elements.lastElement().getPosition().y;
		if(before) {
			charNode = getNearestCharInLine(_lines.firstElement(), point.x);
		} else if (after) {
			charNode = getNearestCharInLine(_lines.lastElement(), point.x);
		} else {
			index = 0;
			_lines.every(function (line) {
				var top = index * _lineHeight + _margin;
				var bottom = top + _lineHeight;
				var match = point.y > top && point.y <= bottom ;
				if (match) {
					if(contour) {
						charNode = point.x < _margin? line.chars.firstElement() : line.chars.lastElement();
					} else {
						charNode = getNearestCharInLine(line, point.x);
					}
					insertBefore = charNode == line.chars.lastElement() && line != _lines.lastElement();
				}
				index++;
				return charNode == undefined;
			});
		}
		dataChar = charNode.getAttribute("data-char");
		position = Number(dataChar) + (point.x > (charNode.getPosition().x + _elementsWidth[charNode.textContent] / 2)? 1 : 0);
		return {position:position, insertBefore:insertBefore};*/

	/*	function getNearestCharInLine(line, x) {
		var charNode;
		line.chars.every(function (char) {
			var left = char.getPosition().x;
			var right = left + _elementsWidth[char.textContent];
			if(x < left || x < right || char == line.chars.lastElement()) {
				charNode = char;
			}
			return charNode == undefined;
		});
		return charNode;
	}*/
	}

	self.caretPosition = function() {
		return {x:Number(_IBeam.getAttribute("x")), y:Number(_IBeam.getAttribute("y")) + _lineHeight / 2};
	}

	self.margin = function(value) {
		_margin = value;
		self.render();
	}

	self.focus = function(value) {
		return
		_focus = value;
		setIBeam(_focus);
		if(_focus) {
			_textFlow.appendChild(_IBeam);
		} else {
			if(_IBeam.parentNode) {
				_textFlow.removeChild(_IBeam);
			}
		}
	}

	self.getLineHeight = function() {
		return _lineHeight;
	}
	

	self.render = function(elements, width, height) {
		if(!arguments.length) {
			elements = _elements;
			width = _width;
			height = _height;
		}
		_elements = elements || [];
		console.log(">>>", _elements.length)

		/*if(!arguments.length) //use current values?
		while (_textFlow.firstChild) {
		    _textFlow.removeChild(_textFlow.firstChild);
		}
		_lines = [];
		_blocks = [];
		_elements = [];
		var string = _data || NBSP;
		var blocks = string.scan(/(\S+|\s+)/g);
		var chars, dx, x, y, lineNode, blockNode, blockCharNodes, charNode;
		var size = {width:0, height:0};
		blocks.forEach(function(block) {
			blockNode = _textFlow.appendChild(document.createElementNS(NS, "g"));
			blockCharNodes = [];
			block = block.replace(/ /g, NBSP);
			chars = block.split("");
			dx = 0;
			chars.forEach(function(char) {
				charNode = blockNode.appendChild(document.createElementNS(NS, "text"));
				charNode.textContent = char;
				charNode.move(dx, 0);
				charNode.setAttributes({
					class: CharClass,
					"data-char":_elements.length,
					"data-block":_blocks.length
				});
				blockCharNodes.push(charNode);
				_elements.push(charNode);
				_elementsWidth[char] = _elementsWidth[char] || charNode.getBBox().width;
				dx += _elementsWidth[char];
			});
			_lineHeight = _lineHeight || charNode.getBBox().height;
			var isFirstBlock = _blocks.length == 0;
			var isEmpty = _data.length == 0;
			var isTrailingSpace = !isFirstBlock && block.match(NBSP);
			if(lineNode == undefined || (x + dx > width - _margin * 2 && !isTrailingSpace)) {
				x = _margin;
				y = _lines.length? y + _lineHeight : _margin + _fontSize;
				lineNode = _textFlow.appendChild(document.createElementNS(NS, "g"));
				_lines.push({node:lineNode, blocks:[], chars:[]});
			}
			lineNode.appendChild(blockNode);
			blockCharNodes.forEach(function(charNode) {
				charNode.setAttributes({
					"data-line":_lines.lastIndex(),
				});
				charNode.offset(x, y);
			});
			_blocks.push({node:blockNode, chars:blockCharNodes});
			_lines.lastElement().chars = _lines.lastElement().chars.concat(blockCharNodes);
			_lines.lastElement().blocks.push(blockNode);
			x += dx;
			if(!isTrailingSpace || isEmpty) size.width = Math.max(size.width, x);
		});
		size.width += _margin;
		size.height = y + _margin;
		_width = size.width;
		_height = size.height;
		_wrapper.setAttribute("style", "width:" + Math.max(_container.clientWidth, _width) + "px;height:" + Math.max( _container.clientHeight, _height) + "px;");*/
	}

	function getPath(start, end) {
		var positionFrom = _elements[start].getPosition();
		var positionTo = _elements[end].getPosition();
		if(end == _elements.length) {
			positionTo.x += _elementsWidth[_elements[to].textContent];
		}
		var range = [Number(_elements[from].getAttribute("data-line")), Number(_elements[to].getAttribute("data-line"))];
		var path = ""; 
		for (var index = range[0]; index <= range[1]; index++) {
			var line = _lines[index].node;
			var last = line.lastChild.lastChild;
			var rect = {left:_margin, top:_margin + index * _lineHeight, right:last.getPosition().x + _elementsWidth[last.textContent], bottom:_margin + (index + 1) * _lineHeight};
			if(index == range[0]) {
				rect.left = positionFrom.x;
			}
			if(index == range[1]) {
				rect.right = positionTo.x;
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
			_textFlow.removeChild(_IBeam);
		} else {
			_textFlow.appendChild(_IBeam);
		}
	}

	function setIBeam(value) {
		window.clearInterval(_IBeamInterval);
		if(value && _focus) {
			_IBeamInterval = window.setInterval(toogleIBeam, 500);
			_textFlow.appendChild(_IBeam);
		} else if(_IBeam.parentNode) {
			_textFlow.removeChild(_IBeam);
		}
	}

	function getFontSize(TextClass) {
		var text = document.body.appendChild(document.createElement("div"));
		text.setAttribute("class", TextClass);
		text.textContent = "X";
		var fontSize = window.getComputedStyle(text).getPropertyValue("font-size");
		document.body.removeChild(text);
		return Number(fontSize.match(/\d+/));
	}

	init();
}