function TextInput(containerId) {

	EventDispatcher.call(this);
	InvalidateElement.call(this);

	var self = this;
	var _container;
	var _display;
	var _selection;
	var _keyTracker;
	var _caret = 0;
	var _elements = [];
	var _focus;

	function init(containerId) {
		_selection = new Selection();
		_selection.addEventListener(Event.SELECT, selectHandler);
		_keyTracker = new KeyTracker(self, _selection);
		_display = new TextDisplay();
		_container = document.getElementById(containerId);
		_container.addEventListener("mousedown", mouseHandler);
		_container.addEventListener("dblclick", doubleClickHandler);
		_container.addEventListener("click", clickHandler);
		_container.appendChild(_display.source());
		self.invalidate();
	}

	self.focus = function(value) {
		if(!arguments.length) {
			return _focus;
		} else {
			_focus = value;
			if(_focus) {
				document.addEventListener("click", clickOutsideHandler);
				_container.setAttribute("class", "svgInput-focus");
				_display.focus(true);
				_keyTracker.activate();
			} else {
				document.removeEventListener("click", clickOutsideHandler);
				_container.setAttribute("class", "svgInput");
				_display.focus(false);
				_keyTracker.deactivate();
			}
		}
	}

	self.data = function(value) {
		if(!arguments.length) {
			var data = [];
			_elements.forEach(function(element) {
				switch(element.type()) {
					case "character":
						if(typeof data.lastElement() != "string") {
							data.push("");
						}
						data.lastElement() = data.lastElement() + element.text();
						break;
					case "pill":
						data.push({id:element.id(), text:element.text()});
						break;
				}
			});
			return data;
		} else {
			_elements = [];
			value.forEach(function(entry) {
				switch(typeof entry) {
					case "string":
						var chars = entry.split("");
						chars.forEach(function(char) {
							_elements.push(new Character(char));
						});
						break;
					case "object":
						_elements.push(new Pill(entry.id, entry.text));
						break;
				}
			});
			_selection.limit(_elements.length);
			self.invalidate();
		}
	}

	self.appendChar = function(char, start, remove) {
		if(char != undefined) {
			var character = new Character(char);
			_elements.splice(start, remove, character);
		} else {
			_elements.splice(start, remove);
		}
		_selection.limit(_elements.length);
		self.invalidate();
	}

	self.caret = function(value) {
		if(!arguments.length) {
			return _caret;
		} else {
			_caret = Math.max(0, Math.min(_elements.length, value));
			_display.moveCaret(_caret);
			var position = _display.caretPosition();
			var margin = _display.margin();
			if(_container.scrollLeft + margin > position.x) {
				_container.scrollLeft = position.x - margin;
			} else if(_container.scrollLeft + _container.clientWidth - margin < position.x) {
				_container.scrollLeft = position.x + margin - _container.clientWidth;
			}
			if(_container.scrollTop + margin > position.y) {
				_container.scrollTop = position.y - margin;
			} else if(_container.scrollTop + _container.clientHeight - margin < position.y) {
				_container.scrollTop = position.y + margin - _container.clientHeight;
			}
			console.log(self.toString());
		}
	}

	self.jump = function(value) {
		var point = _display.carePosition();
		point.y += value * _display.lineHeight();
		self.caret(_display.getNearestPosition(point, false));
	}

	self.prevBoundary = function(value) {
		return Number(_elements[value].source().parentNode.firstChild.getAttribute("data-index"));
	}

	self.nextBoundary = function(value) {
		return Number(_elements[value].source().parentNode.lastChild.getAttribute("data-index"));
	}

	self.render = function() {
		var style = window.getComputedStyle(_container);
		var innerWidth = Number(style.getPropertyValue("width").match(/\d+/));
		var innerHeight = Number(style.getPropertyValue("height").match(/\d+/));
		_display.render(_elements, innerWidth, innerHeight);
		var overFlowX = _elements.length && _display.width() > innerWidth;
		var overFlowY = _elements.length && _display.height() > innerHeight;
		var width = overFlowX? _container.clientWidth : innerWidth;
		var height = overFlowY? _container.clientHeight : innerHeight;
		if(overFlowX || overFlowY) {
			_display.render(_elements, width, height);
		}
		self.caret(_caret);
		if(_selection.length()) {
			_display.drawSelection(_selection.start(), _selection.end());
		} else {
			_display.clearSelection();
		}
		if(!overFlowX) _container.scrollLeft = 0;
		if(!overFlowY) _container.scrollTop = 0;
		_container.setAttribute("style", "overflow-x:" + (overFlowX? "scroll" : "hidden") + ";overflow-y" + (overFlowY? "scroll" : "hidden"));
	}

	self.toString = function() {
		var string = "";
		var caret = _caret;
		var start = _selection.start();
		var end = _selection.end();
		var index = 0;
		_elements.forEach(function(element) {
			switch(element.type()) {
				case "character":
					string += element.toString();
					break;
				case "pill":
					string += element.toString();
					var offset = element.toString().length - 1;
					caret += caret > index? offset : 0;
					start += start > index? offset : 0;
					end += end > index? offset : 0;
					break;
			}
			index++;
		});
		if(_selection.length()) {
			string = string.splice(end, 0, "]").splice(start, 0, "[");
		} else {
			string = string.splice(caret, 0, "|");
		}
		return string;
	}

	function mousePosition(e) {
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
		var caret;
		var insertBefore = false;
		var mouse = mousePosition(e);
		var index = e.target.getAttribute("data-index");
		if(index) {
			var element = _elements[index];
			caret = Number(index) + (mouse.x > (element.x() + element.source().getBBox().width / 2)? 1 : 0);
			insertBefore = element.source().parentNode.nextSibling == undefined;
		} else {
			var nearestPosition = _display.getNearestPosition(mouse, true);
			caret = nearestPosition.position;
			insertBefore = nearestPosition.insertBefore;
		}
		switch(e.type) {
			case "mousedown":
				if(e.shiftKey) {
					if(_selection.length()) {
						_selection.set(_selection.from(), caret);
					} else {
						_selection.set(_caret, caret);
					}
				} else {
					_selection.clear();
				}
				self.caret(caret);
				break;
			case "mousemove":
				_selection.set(_caret, caret);
				break;
			case "mouseup":
				self.caret(caret);
				break;
		}
	}

	function clickHandler(e) {
		e.stopPropagation();
		self.focus(true);
	}

	function doubleClickHandler(e) {
		if(e.target.getAttribute("data-index")) {
			var block = _blocks[index];
			var firstNode = e.target.parentNode.firstChild;
			var lastNode = e.target.parentNode.lastChild;
			if(firstNode.textContent.match(NBSP)) {
				if(firstNode.parentNode.previousSibling) {
					firstNode = firstNode.parentNode.previousSibling.firstChild;
				}
			} else {
				if(lastNode.parentNode.nextSibling) {
					lastNode = lastNode.parentNode.nextSibling.lastChild;
				}
			}
			_selection.set(Number(firstNode.getAttribute("data-index")), Number(lastNode.getAttribute("data-index")) + 1);
		}
	}

	function clickOutsideHandler(e) {
		e.stopPropagation();
		self.focus(false);
	}

	function selectHandler(e) {
		if(e.info.length) {
			_display.drawSelection(e.info.start, e.info.end);
		} else {
			_display.clearSelection();
		}
	}

	init(containerId);
}