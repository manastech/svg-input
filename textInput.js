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
	var _autoExpand;
	var _minHeight;
	var _scrollHeight = 0;
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
		_container.addEventListener("contextmenu", contextMenuHandler);
		_wrapper = _container.appendChild(document.createElement("div"));
		_wrapper.style.cursor = "text";
		_wrapper.id = "wrapper";
		_wrapper.appendChild(_display.source());
		self.invalidate();
		self.margin(5);
	}

	self.focus = function(value) {
		if(!arguments.length) {
			return _focus;
		} else {
			_focus = value;
			if(_focus) {
				document.addEventListener("click", clickOutsideHandler);
				_container.className = "svgInput svgInput-focus";
				_display.focus(true);
				_keyTracker.activate();
			} else {
				document.removeEventListener("click", clickOutsideHandler);
				_container.className = "svgInput";
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

	self.width = function() {
		var style = window.getComputedStyle(_container);
		return Number(style.getPropertyValue("width").match(/\d+/));
	}

	self.height = function() {
		var style = window.getComputedStyle(_container);
		return Number(style.getPropertyValue("height").match(/\d+/));
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
						data[data.lastIndex()] = data.lastElement() + element.text();
						break;
					case "pill":
						data.push({id:element.id(), label:element.label(), text:element.text(), opperator:element.opperator()});
						break;
				}
			});
			return data;
		} else {
			_elements = [];
			var info = "";
			value.forEach(function(entry) {
				switch(typeof entry) {
					case "string":
						var chars = entry.replace(/\s/g, "\u00A0").split("");
						chars.forEach(function(char) {
							_elements.push(new Character(char));
						});
						info += entry;
						break;
					case "object":
						_elements.push(new Pill(entry.id, (entry.label || "").replace(/\s/g, "\u00A0"), (entry.text || "").replace(/\s/g, "\u00A0"), entry.opperator));
						info += "(" + (entry.text || entry.label) + ")";
						break;
				}
			});
			self.caret(_elements.length);
			_selection.limit(_elements.length);
			self.invalidate();
			self.dispatchEvent(new Event(Event.CHANGE, info));
		}
	}

	self.appendChar = function(string, start, remove) {
		_elements.splice(start, remove);
		if(string != undefined) {
			var chars = string.split("");
			chars.forEach(function(char) {
				var character = new Character(char.replace(/\s/g, "\u00A0"));
				_elements.splice(start, 0, character);
				start++;
			});
		}
		_selection.limit(_elements.length);
		self.render();
		self.dispatchEvent(new Event(Event.CHANGE, string));
	}

	self.caret = function(value) {
		if(!arguments.length) {
			return _caret;
		} else {
			_caret = Math.max(0, Math.min(_elements.length, value));
			_display.moveCaret(_caret);
			var position = _display.caretPosition();
			if(_container.scrollLeft > position.x) {
				_container.scrollLeft = position.x;
			} else if(_container.scrollLeft + _container.clientWidth - _margin * 2 < position.x) {
				_container.scrollLeft = position.x + _margin * 2 - _container.clientWidth;
			}
			if(_container.scrollTop > position.y - _display.fontSize()) {
				_container.scrollTop = position.y - _display.fontSize();
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

	self.getPillById = function(id) {
		var pill;
		_elements.every(function(element) {
			if(element.type() == "pill" && element.id() == id) {
				pill = element;
			}
			return pill == undefined;
		});
		return pill;
	}

	self.breakPill = function(id, replaceText) {
		var pill = self.getPillById(id);
		replaceText = replaceText || pill.label();
		self.appendChar(replaceText, _elements.indexOf(pill), 1);
	}

	self.createPill = function() {
		var label = "";
		for (var index = _selection.start(); index < _selection.end(); index++) {
			label += _elements[index].text();
		}
		if(self.GUIDgenerator != undefined) {
			var id = self.GUIDgenerator();
		}
		_elements.splice(_selection.start(), _selection.length(), new Pill(id, label));
		_selection.clear();
		self.invalidate();
	}

	self.render = function() {
		var innerWidth = self.width() - _margin * 2;
		var innerHeight = self.height() - _margin * 2;
		_minHeight = _minHeight || self.height();
		_display.render(_elements, innerWidth, innerHeight);
		var overflowX = _elements.length && _display.width() > innerWidth;
		var overflowY = _elements.length && _display.height() > innerHeight && !_autoExpand;
		if(overflowX) {
			_scrollHeight = _scrollHeight || _minHeight - _container.clientHeight;
		}
		var width = overflowY? _container.clientWidth - _margin * 2 : innerWidth;
		var height = overflowX? _container.clientHeight - _margin * 2 : innerHeight;
		if(overflowX || overflowY) {
			_display.render(_elements, width, height);
		}
		if(_selection.length()) {
			_display.drawSelection(_selection.start(), _selection.end());
		} else {
			_display.clearSelection();
		}
		if(!overflowX) _container.scrollLeft = 0;
		if(!overflowY) _container.scrollTop = 0;
		_wrapper.style.padding = _margin + "px";
		_wrapper.style.width = _display.width() + "px";
		_wrapper.style.height = _display.height() + "px";
		_container.style.overflowX = overflowX? "scroll" : "hidden";
		_container.style.overflowY = overflowY && !_autoExpand? "scroll" : "hidden";
		if(_autoExpand) {
			var contentHeight = _display.computedHeight() + _margin * 2 + (overflowX? _scrollHeight : 0);
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

	function mouseHandler(e) {
		if(_container.contains(e.target)) {
			self.focus(true);
		}
		if(e.target == _container || e.button) return;
		var mouse = mousePosition(e);
		mouse.x -= _container.offsetLeft;
		mouse.y -= _container.offsetTop;
		mouse.x += _container.scrollLeft;
		mouse.y += _container.scrollTop;
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
		var index = e.target.getAttribute("data-index");
		if(index) {
			var element = _elements[index];
			caret = Number(index) + (mouse.x > (element.x() + element.source().getBBox().width / 2)? 1 : 0);
			insertBefore = element.source().parentNode.nextSibling == undefined;
		} else {
			var contour = _dragTarget == undefined;
			var nearestPosition = _display.nearestPosition(mouse, contour);
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
				if(e.target.parentNode.getAttribute("type") == "pill") {
					_dragTarget = e.target.parentNode;
					var bounds = _dragTarget.getBBox();
					var pill = document.createElement("div");
					var svg = pill.appendChild(document.createElementNS("http://www.w3.org/2000/svg","svg"));
					svg.style.position = "absolute";
					svg.style.left = (bounds.x - mouse.x + _margin) + "px";
					svg.style.top = (bounds.y - mouse.y + _margin) + "px";
					var clone = svg.appendChild(_dragTarget.cloneNode(true));
					pill.style.width = bounds.width + "px";
		            pill.style.height = bounds.height + "px";
					for (var index = clone.childElementCount - 1; index >= 0; index--) {
						var child = clone.childNodes[index];
						child.setAttribute("x", 0);
						child.setAttribute("y", _display.fontSize());
					}
					document.body.style.cursor = "move";
					self.dispatchEvent(new Event(Event.DRAG, {pill:pill, mouseX:mouse.x + _container.offsetLeft - _container.scrollLeft, mouseY:mouse.y + _container.offsetTop - _container.scrollTop}));
				}
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
					if(0 <= mouse.x && mouse.x <= self.width() && 0 <= mouse.y && mouse.y <= self.height()) {
						var element = _elements[index];
						_elements.splice(index, 1);
						if(_caret > index) {
							self.caret(_caret - 1);
						}
						_elements.splice(_caret, 0, element);
						index = _caret;
					}
					_dragTarget = undefined;
					self.render();
					self.caret(index + 1);
					document.body.style.cursor = "auto";
					self.dispatchEvent(new Event(Event.DROP));
				}
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

	function contextMenuHandler(e) {
		if(e.target.parentNode.getAttribute("type") == "pill") {
			var info = {};
			info.mouseX = e.x;
			info.mouseY = e.y;
			info.pill = self.getPillById(e.target.parentNode.getAttribute("data-id"));
			self.dispatchEvent(new Event(Event.CONTEXT_MENU, info));
		}
		e.preventDefault();
	}

	function clickOutsideHandler(e) {
		if(!_container.contains(e.target)) {
			self.focus(false);
		}
	}

	function selectHandler(e) {
		if(e.info.length) {
			_display.drawSelection(e.info.start, e.info.end);
		} else {
			_display.clearSelection();
		}
		self.dispatchEvent(e);
	}

	init(containerId);
}