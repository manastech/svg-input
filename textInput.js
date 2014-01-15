function TextInput(containerId) {

	EventDispatcher.call(this);
	InvalidateElement.call(this);

	var self = this;
	var _caret = 0;
	var _selection;
	var _string = "";
	var _width = 100;
	var _height = 100;
	var _container = document.getElementById(containerId);
	var _textDisplay = new TextDisplay();
	_container.appendChild(_textDisplay.svg);
	_container.addEventListener("click", clickHandler);
	this.invalidate();

	self.setSize = function(width, height) {
		_width = width;
		_height = height;
		this.invalidate();
	}

	self.render = function() {
		_textDisplay.setSize(_width, _height);
	}

	self.setFocus = function(value) {
		if(value) {
			_textDisplay.setFocus(true);
			document.addEventListener("keypress", keyPressHandler);
			document.addEventListener("keydown", keyDownHandler);
			document.addEventListener("click", clickOutsideHandler);
		} else {
			_textDisplay.setFocus(false);
			document.removeEventListener("keypress", keyPressHandler);
			document.removeEventListener("keydown", keyDownHandler);
			document.removeEventListener("click", clickOutsideHandler);
		}
	}

	function state() {
		var state;
		if(_selection != undefined) {
			var start = Math.min(_selection[0], _selection[1]);
			var end = Math.max(_selection[0], _selection[1]);
			if(start != end) {
				state = _string.splice(end, 0, "]").splice(start, 0, "[");
			}
		}
		if(state == undefined) {
			state = _string.splice(_caret, 0, "|");
		}
		return state;
	}

	function bound(value) {
		return Math.max(0, Math.min(_string.length, value));
	}

	function setSelection(last, current) {
		if(arguments[0] == undefined) {
			_selection = undefined;
			return;
		}
		if(_selection == undefined) {
			_selection = [last, current];
		} else {
			_selection[1] = current;
		}
	}

	function updatTextDisplay() {
		_textDisplay.setData(_string);
		_textDisplay.setCaret(_caret);
	}

	function clickHandler(e) {
		e.stopPropagation();
		self.setFocus(true);
	}

	function keyPressHandler(e) {
		e.preventDefault();
		var char = String.fromCharCode(e.keyCode);
		var start = _selection != undefined? Math.min(_selection[0], _selection[1]) : _caret;
		var length = _selection != undefined? Math.max(_selection[0], _selection[1]) - start : 0;
		_string = _string.splice(start, length, char);
		setSelection();
		_caret++;
		updatTextDisplay();
		console.log(state());
	}

	function keyDownHandler(e) {
		var start, length;
		var caret = _caret;
		var update = true;
		switch(e.keyCode) {
			case 8://Backspace
				e.preventDefault();
				if(caret) {
					start = _selection != undefined? Math.min(_selection[0], _selection[1]) : caret - 1;
					length = _selection != undefined? Math.max(_selection[0], _selection[1]) - start : 1;
					_string = _string.splice(start, length, "");
					if(_selection == undefined) {
						caret--;
					}
				}
				setSelection();
				break;
			case 9://Tab
			case 27://Escape
				self.setFocus(false);
				break;
			case 13://Enter
				break;
			case 16://Shift
			case 17://Control
			case 18://Alt
				return;
				break;
			case 33://Page up
				break;
			case 34://Page down
				break;
			case 35://End
				caret = Number.MAX_VALUE;
				if(e.shiftKey) {
					setSelection(_caret, caret);
				} else {
					setSelection();
				}
				break;
			case 36://Home
				caret = 0;
				if(e.shiftKey) {
					setSelection(_caret, caret);
				} else {
					setSelection();
				}
				break;
			case 37://Arrow left
				if(e.ctrlKey || e.metaKey) {
					var prevSpace = _string.substring(0, caret - 1).lastIndexOf(" ");
					if(prevSpace != -1) {
						caret = prevSpace + 1;
					} else {
						caret = 0;
					}
				} else {
					caret--;
				}
				if(e.shiftKey) {
					setSelection(_caret, caret);
				} else {
					setSelection();
				}
				break;
			case 38://Arrow up
				break;
			case 39://Arrow right
				if(e.ctrlKey || e.metaKey) {
					var nextSpace = _string.indexOf(" ", caret);
					if(nextSpace != -1) {
						caret = nextSpace + 1;
					} else {
						caret = Number.MAX_VALUE;
					}
				} else {
					caret++;
				}
				if(e.shiftKey) {
					setSelection(_caret, caret);
				} else {
					setSelection();
				}
				break;
			case 40://Arrow down
				break;
			case 46://Delete
				start = _selection != undefined? Math.min(_selection[0], _selection[1]) : caret;
				length = _selection != undefined? Math.max(_selection[0], _selection[1]) - start : 1;
				if(length > 1 || caret < _string.length) {
					_string = _string.splice(start, length, "");
				}
				setSelection();
				break;
			default:
				update = false;
				break;
		}
		if(update) {
			_caret = bound(caret);
			if(_selection != undefined) {
				_selection[0] = bound(_selection[0]);
				_selection[1] = bound(_selection[1]);
			}
			updatTextDisplay();
			console.log(state());
		}
	}

	function clickOutsideHandler(e) {
		e.stopPropagation();
		self.setFocus(false);
	}
}

String.prototype.splice = function(index, remove, string) {
    return this.slice(0, index) + string + this.slice(index + Math.abs(remove));
};