
function TextDisplay(container) {

	EventDispatcher.call(this);

	var NS = "http://www.w3.org/2000/svg";
	var NBSP = "\u00A0";
	var ZWSP = "\u200B";
	var BLOCK = "\u2588";
	var self = this;
	var CharClass = "char";
	var _data = "";
	var _width = 100;
	var _height = 0;
	var _margin = 5;
	var _fontSize = 14;
	var _lineHeight;
	var _container = container;
	var _wrapper;
	var _textFlow;
	var _svg;
	var _caretPosition;
	var _selection;
	var _selectionArea;
	var _IBeam;
	var _IBeamInterval;
	var _focus;
	var _lines;
	var _blocks;
	var _chars;
	var _fontMeasures = [];

	//space + wordboundary (review select + trailing space)
	//one space per block
	
	//cascade changes, self.render data -line -block -char
	//appendCharAt
	//removeCharAt
	//autoexpand
	//firefox font size

	function init() {
		_wrapper = _container.appendChild(document.createElement("div"));
		_wrapper.addEventListener("mousedown", mouseHandler);
		_wrapper.addEventListener("dblclick", doubleClickHandler);
		_wrapper.setAttribute("id","wrapper");
		_svg = _wrapper.appendChild(document.createElementNS(NS,"svg"));
		_selectionArea = _svg.appendChild(document.createElementNS(NS,"g"));
		_textFlow = _svg.appendChild(document.createElementNS(NS,"g"));
		_fontSize = getFontSize(CharClass);
		_IBeam = document.createElementNS(NS,"rect");
		_IBeam.setAttributes({width:1, style:"fill:#000000", "pointer-events":"none"});
		_pillButton = document.createElement("div");
		_pillButton.setAttribute("class", "pill");
		_pillButton.addEventListener("click", pillClickHandler);
		self.setFocus(false);
	}

	self.setData = function(value) {
		_data = value;
		self.render();
	}

	self.setCaret = function (value) {
		_caretPosition = value;
		var charNode = _chars[Math.max(0, Math.min(_chars.length - 1, value))];
		var charNodePosition = charNode.getPosition();
		var caretPosition = {};
		caretPosition.x = charNodePosition.x + (value == _chars.length? _fontMeasures[charNode.textContent] : 0);
		caretPosition.y = charNodePosition.y - _fontSize;
		_IBeam.setAttributes({x:caretPosition.x, y:caretPosition.y, height:_lineHeight});
		var left = caretPosition.x - _margin;
		var right = caretPosition.x + _margin - _container.clientWidth;
		var top = caretPosition.y - _margin;
		var bottom = caretPosition.y + _lineHeight + _margin - _container.clientHeight;
		if(_container.scrollLeft > left) {
			_container.scrollLeft = left;
		} else if(_container.scrollLeft < right) {
			_container.scrollLeft = right;
		}
		if(_container.scrollTop > top) {
			_container.scrollTop = top;
		} else if(_container.scrollTop < bottom) {
			_container.scrollTop = bottom;
		}
		setIBeam(true);
	}

	self.getCaretPosition = function() {
		return {x:Number(_IBeam.getAttribute("x")), y:Number(_IBeam.getAttribute("y")) + _lineHeight / 2};
	}

	self.getNearestCaretPosition = function(point, contour) {
		if(!_data.length) return {position:0, insertBefore:false};
		var position, charNode, dataChar, index;
		var insertBefore = false;
		var before = point.y <= _margin;
		var after = point.y > _chars.lastElement().getPosition().y;
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
		position = Number(dataChar) + (point.x > (charNode.getPosition().x + _fontMeasures[charNode.textContent] / 2)? 1 : 0);
		return {position:position, insertBefore:insertBefore};
	}

	self.setSelection = function() {
		while(_selectionArea.firstChild) {
			_selectionArea.removeChild(_selectionArea.firstChild);
		}
		_chars.forEach(function (char) {
			char.setAttributes({style:"fill:#000000"});
		});
		if(_pillButton.parentNode) {
			_pillButton.parentNode.removeChild(_pillButton);
		}
		var empty = !arguments.length || arguments[0] == arguments[1];
		_selection = empty? undefined : arguments;
		_IBeam.setAttributes({opacity:empty? 1 : 0});
		if(empty) return;
		var endChar = _chars[arguments[1]];
		var endPosition = endChar.getPosition();
		_container.appendChild(_pillButton);
		_pillButton.setAttribute("style", "top:" + endPosition.y + "px;left:" + (endPosition.x - _fontMeasures[endChar.textContent] / 2) + "px;");
		var from = Math.min(arguments[0], arguments[1]);
		var to = Math.max(arguments[0], arguments[1]);
		var path = _selectionArea.appendChild(document.createElementNS(NS, "path"));
		path.setAttributes({d:getPath(from, to), fill:"#0066ff"});
		for (var index = from; index < to && index < _chars.length; index++) {
			_chars[index].setAttributes({style:"fill:#ffffff"});
		}
	}

	self.setMargin = function(value) {
		_margin = value;
		self.render();
	}

	self.setFocus = function(value) {
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

	self.render = function() {
		draw(_container.offsetWidth, _container.offsetHeight);
		var overFlowX = _data.length && _width > $(_container).innerWidth();
		var overFlowY = _data.length && _height > $(_container).innerHeight();
		_container.setAttribute("style", "overflow-x:" + (overFlowX? "scroll" : "hidden") + ";overflow-y:" + (overFlowY? "scroll" : "hidden") + ";");
		var width = overFlowX? _container.clientWidth : _width;
		var height = overFlowY? _container.clientHeight : _height;
		if(overFlowX || overFlowY) {
			draw(width, height);
		}
		if(!overFlowX) _container.scrollLeft = 0;
		if(!overFlowY) _container.scrollTop = 0;
		_wrapper.setAttribute("style", "width:" + Math.max(_container.clientWidth, _width) + "px;height:" + Math.max( _container.clientHeight, _height) + "px;");
	}

	function draw(width, height) {
		clear();
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
					"data-char":_chars.length,
					"data-block":_blocks.length
				});
				blockCharNodes.push(charNode);
				_chars.push(charNode);
				_fontMeasures[char] = _fontMeasures[char] || charNode.getBBox().width;
				dx += _fontMeasures[char];
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
					"data-line":_lines.length - 1,
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
	}

	function getNearestCharInLine(line, x) {
		var charNode;
		line.chars.every(function (char) {
			var left = char.getPosition().x;
			var right = left + _fontMeasures[char.textContent];
			if(x < left || x < right || char == line.chars.lastElement()) {
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
		var positionFrom = _chars[from].getPosition();
		var positionTo = _chars[to].getPosition();
		if(end) {
			positionTo.x += _fontMeasures[_chars[to].textContent];
		}
		var range = [Number(_chars[from].getAttribute("data-line")), Number(_chars[to].getAttribute("data-line"))];
		var path = ""; 
		for (var index = range[0]; index <= range[1]; index++) {
			var line = _lines[index].node;
			var last = line.lastChild.lastChild;
			var rect = {left:_margin, top:_margin + index * _lineHeight, right:last.getPosition().x + _fontMeasures[last.textContent], bottom:_margin + (index + 1) * _lineHeight};
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

	function clear() {
		while (_textFlow.firstChild) {
		    _textFlow.removeChild(_textFlow.firstChild);
		}
		_lines = [];
		_blocks = [];
		_chars = [];
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

	function getMouseCoordinates(e) {
		var mouse = {};
		if (e.pageX || e.pageY) { 
		  mouse.x = e.pageX;
		  mouse.y = e.pageY;
		} else { 
		  mouse.x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft; 
		  mouse.y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop; 
		} 
		mouse.x -= _container.offsetLeft;
		mouse.y -= _container.offsetTop;
		mouse.x += _container.scrollLeft;
		mouse.y += _container.scrollTop;
		return mouse;
	}

	function getFontSize(TextClass) {
		var text = document.body.appendChild(document.createElement("div"));
		text.setAttribute("class", TextClass);
		text.textContent = "X";
		var fontSize = window.getComputedStyle(text, null).getPropertyValue("font-size");
		document.body.removeChild(text);
		return Number(fontSize.match(/[0-9]+/)[0]);
	}

	function mouseHandler(e) {
		switch(e.type) {
			case "mousedown":
				window.addEventListener("mousemove", mouseHandler);
				window.addEventListener("mouseup", mouseHandler);
				break;
			case "mouseup":
				window.removeEventListener("mousemove", mouseHandler);
				window.removeEventListener("mouseup", mouseHandler);
				break;
		}
		var caret, caretPosition;
		var mouse = getMouseCoordinates(e);
		var dataChar = e.target.getAttribute("data-char");
		if(dataChar != undefined) {
			charNode = _chars[dataChar];
			caretPosition = Number(dataChar) + (mouse.x > (charNode.getPosition().x + _chars[charNode.textContent] / 2)? 1 : 0);
		} else {
			caret = self.getNearestCaretPosition(mouse, true);
			caretPosition = caret.position - (caret.insertBefore? 1 : 0);
		}
		switch(e.type) {
			case "mousedown":
				if(e.shiftKey) {
					if(_selection != undefined) {
						self.setSelection(_selection[0], caretPosition);
					} else {
						self.setSelection(_caretPosition, caretPosition);
					}
				} else {
					self.setSelection();
				}
				self.setCaret(caretPosition);
				break;
			case "mousemove":
				self.setSelection(_caretPosition, caretPosition);
				break;
			case "mouseup":
				self.setCaret(caretPosition);
				self.dispatchEvent(new Event(Event.CARET, _caretPosition));
				self.dispatchEvent(new Event(Event.SELECTION, _selection));
				break;
		}
		
	}

	function doubleClickHandler(e) {
		var index = e.target.getAttribute("data-block");
		if(index != undefined) {
			var block = _blocks[index];
			var from = Number(block.chars.firstElement().getAttribute("data-char"));
			var to = Number(block.chars.lastElement().getAttribute("data-char")) + 1;
			if(block.chars.firstElement().textContent.match(NBSP)) {
				if(block.chars.firstElement().parentNode.previousSibling) {
					from = Number(block.chars.firstElement().parentNode.previousSibling.firstChild.getAttribute("data-char"));
				}
			} else {
				if(block.chars.firstElement().parentNode.nextSibling) {
					to = Number(block.chars.firstElement().parentNode.nextSibling.lastChild.getAttribute("data-char")) + 1;
				}
			}
			self.setSelection(from, to);
			self.dispatchEvent(new Event(Event.SELECTION, _selection));
		}
	}

	function pillClickHandler(e) {
		var from = Math.min(_selection[0], _selection[1]);
		var to = Math.max(_selection[0], _selection[1]);
		self.dispatchEvent(new Event(Event.PILL, [from, to + 1]));
	}

	init();
}