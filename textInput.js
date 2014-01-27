function TextInput(containerId) {

	EventDispatcher.call(this);
	InvalidateElement.call(this);

	var self = this;
	var _container;
	var _wrapper;
	var _display;
	var _selection;
	var _keyTracker;
	var _caret = 0;
	var _elements = [];
	var _focus;
	var _margin;
	var _button;
	var _autoExpand;
	var _minHeight;
	var _scrollHeight;
	var _dragTarget;
	var _debug;

	function init(containerId) {
		_selection = new Selection();
		_selection.addEventListener(Event.SELECT, selectHandler);
		_keyTracker = new KeyTracker(self, _selection);
		_display = new TextDisplay();
		_container = document.getElementById(containerId);
		_container.addEventListener("mousedown", mouseHandler);
		_container.addEventListener("dblclick", doubleClickHandler);
		_wrapper = _container.appendChild(document.createElement("div"));
		_wrapper.setAttribute("id","wrapper");
		_wrapper.appendChild(_display.source());
		_button = _container.parentNode.insertBefore(document.createElement("button"), _container.nextSibling);
		_button.textContent = "Create pill";
		_button.addEventListener("click", buttonClickHandler);
		_button.style.display = "none";
		self.invalidate();
		self.margin(5)
	}

	self.focus = function(value) {
		if(!arguments.length) {
			return _focus;
		} else {
			_focus = value;
			if(_focus) {
				document.addEventListener("click", clickOutsideHandler);
				_container.setAttribute("class", "svgInput svgInput-focus");
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

	self.margin = function(value) {
		if(!arguments.length) {
			return _margin;
		} else {
			_margin = value;
			self.invalidate();
		}
	}

	self.autoExpand = function(value) {
		if(!arguments.length) {
			return _autoExpand;
		} else {
			_autoExpand = value;
			self.invalidate();
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
						var chars = entry.replace(/\s/g, "\u00A0").split("");
						chars.forEach(function(char) {
							_elements.push(new Character(char));
						});
						break;
					case "object":
						_elements.push(new Pill(entry.id, entry.text.replace(/\s/g, "\u00A0")));
						break;
				}
			});
			self.caret(_elements.length);
			_selection.limit(_elements.length);
			self.invalidate();
		}
	}

	self.appendChar = function(char, start, remove) {
		if(char != undefined) {
			var character = new Character(char.replace(/\s/g, "\u00A0"));
			_elements.splice(start, remove, character);
		} else {
			_elements.splice(start, remove);
		}
		_selection.limit(_elements.length);
		self.render();
	}

	self.caret = function(value) {
		if(!arguments.length) {
			return _caret;
		} else {
			_caret = Math.max(0, Math.min(_elements.length, value));
			_display.moveCaret(_caret);
			var position = _display.caretPosition();
			if(_container.scrollLeft + _margin > position.x) {
				_container.scrollLeft = position.x - _margin;
			} else if(_container.scrollLeft + _container.clientWidth - _margin * 2 < position.x) {
				_container.scrollLeft = position.x + _margin * 2 - _container.clientWidth;
			}
			if(_container.scrollTop + _margin > position.y) {
				_container.scrollTop = position.y - _margin;
			} else if(_container.scrollTop + _container.clientHeight - _margin * 2 < position.y) {
				_container.scrollTop = position.y + _margin * 2 - _container.clientHeight;
			}
			if(self.debug()) console.log(self.toString());
		}
	}

	self.jump = function(value) {
		var point = _display.caretPosition();
		point.y += value * _display.lineHeight();
		self.caret(_display.nearestPosition(point, false).index);
	}

	self.prevBoundary = function(value) {
		value = Math.max(0, Math.min(_elements.length - 1, value));
		var boundary = value;
		if(_elements[value].text().match(/\s/)) {
			while (_elements[boundary].text().match(/\s/) && boundary > 0) {
				boundary--;
			}
		}
		while (boundary > 0 && _elements[boundary - 1].text().match(/\S/)) {
			boundary--;
		}
		return boundary;
	}

	self.nextBoundary = function(value) {
		value = Math.max(0, Math.min(_elements.length - 1, value));
		var boundary = value;
		if(_elements[value].text().match(/\s/)) {
			while (boundary < _elements.length && _elements[boundary].text().match(/\s/)) {
				boundary++;
			}
		}
		while (boundary < _elements.length && _elements[boundary].text().match(/\S/)) {
			boundary++;
		}
		return boundary;
	}

	self.render = function() {
		if(_autoExpand) {
			_container.style.height = _minHeight;
		}
		var style = window.getComputedStyle(_container);
		var innerWidth = Number(style.getPropertyValue("width").match(/\d+/));
		var innerHeight = Number(style.getPropertyValue("height").match(/\d+/));
		_minHeight = _minHeight || innerHeight;
		innerWidth -= _margin * 2;
		innerHeight -= _margin * 2;
		_display.render(_elements, innerWidth, _autoExpand? _minHeight : innerHeight);
		var overFlowX = _elements.length && _display.width() > innerWidth;
		var overFlowY = _elements.length && _display.height() > innerHeight && !_autoExpand;
		_scrollHeight = 15//_scrollHeight || Number(style.getPropertyValue("height").match(/\d+/)) - _container.clientHeight;
		var width = overFlowX? _container.clientWidth - _margin * 2 : innerWidth;
		var height = overFlowY? _container.clientHeight - _margin * 2 : innerHeight;
		if(overFlowX || overFlowY) {
			_display.render(_elements, width, height);
		}
		if(_selection.length()) {
			_display.drawSelection(_selection.start(), _selection.end());
		} else {
			_display.clearSelection();
		}
		if(!overFlowX) _container.scrollLeft = 0;
		if(!overFlowY) _container.scrollTop = 0;
		_wrapper.setAttribute("style", "padding:" + _margin + "px;width:" +  _display.width() + "px;height:" + _display.height() + "px;");
		_container.setAttribute("style", "overflow-x:" + (overFlowX? "scroll" : "hidden") + ";overflow-y:" + (overFlowY && !_autoExpand? "scroll" : "hidden"));
		if(_autoExpand) {
			var contentHeight = _display.height() + _margin * 2;
			if(_display.height() - _display.computedHeight() == 0 && overFlowX) {
				contentHeight += _scrollHeight;
				console.log("scroll", _scrollHeight)
			}
			console.log(contentHeight)
			_container.style.height = Math.max(_minHeight, contentHeight) + "px";
			_container.scrollTop = 0;
		}
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

	self.debug = function(value) {
		if (!arguments.length) {
			return _debug;
		} else {
			_debug = value;
			console.log(self.toString());
		}
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
		if(_container.contains(e.target)) {
			self.focus(true);
		}
		if(e.target == _container) return;
		switch(e.type) {
			case "mousedown":
				if(e.target.parentNode.getAttribute("type")) {
					_dragTarget = e.target.parentNode;
				}
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
			var nearestPosition = _display.nearestPosition(mouse, true);
			caret = nearestPosition.index;
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
				if(_dragTarget == undefined) {
					_selection.set(_caret, caret);
				} else {
					self.caret(caret);
				}
				break;
			case "mouseup":
				self.caret(caret);
				if(_dragTarget != undefined) {
					var index = Number(_dragTarget.getAttribute("data-index"));
					var element = _elements[index];
					_elements.splice(index, 1);
					if(_caret > index) {
						self.caret(_caret - 1);
					}
					_elements.splice(_caret, 0, element);
					self.invalidate();
				}
				_dragTarget = undefined;
				break;
		}
	}

	function doubleClickHandler(e) {
		if(e.target.getAttribute("data-index")) {
			var firstNode = e.target.parentNode.firstChild;
			var lastNode = e.target.parentNode.lastChild;
			if(firstNode.textContent.match("\u00A0")) {
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
		if(!_container.contains(e.target)) {
			e.stopPropagation();
			self.focus(false);
		}
	}

	function selectHandler(e) {
		if(e.info.length) {
			_display.drawSelection(e.info.start, e.info.end);
		} else {
			_display.clearSelection();
		}
		_button.style.display = _selection.length()? "block" : "none";
	}

	function buttonClickHandler(e) {
		var label = "";
		for (var index = _selection.start(); index < _selection.end(); index++) {
			label += _elements[index].text();
		}
		_elements.splice(_selection.start(), _selection.length(), new Pill(undefined, label));
		_selection.clear();
		self.invalidate();
	}

	init(containerId);
}