function KeyTracker(input, selection) {

	var self = this;
	var _active = false;
	var _input = input;
	var _selection = selection;

	self.activate = function() {
		_active = true;
		document.addEventListener("keypress", keyPressHandler);
		document.addEventListener("keydown", keyDownHandler);
	}

	self.deactivate = function() {
		_active = false;
		document.removeEventListener("keypress", keyPressHandler);
		document.removeEventListener("keydown", keyDownHandler);
	}

	function select(shift, from, to) {
		if(shift) {
			if(_selection.length()) {
				_selection.set(_selection.from(), to);
			} else {
				_selection.set(from, to);
			}
		} else {
			_selection.clear();
		}
	}

	function keyPressHandler(e) {
		e.preventDefault();
		switch(e.charCode) {
			case 13://Enter
				return;
				break;
			default:
				var start = _selection.length()? _selection.start() : _input.caret();
				var length = _selection.length();
				var char = String.fromCharCode(e.charCode);
				_selection.clear();
				_input.appendChar(char, start, length);
				_input.caret(start + 1);
				break;
		}
	}

	function keyDownHandler(e) {
		var start, length;
		var caret = _input.caret();
		var preventDefault = true;
		switch(e.keyCode) {
			case 13://Enter
			case 16://Shift
			case 17://Control
			case 18://Alt
			case 33://Page up
			case 34://Page down
				preventDefault = false;
				return;
			case 8://Backspace
				if(caret || _selection.length()) {
					start = _selection.length()? _selection.start() : caret - 1;
					length = Math.max(1, _selection.length());
					caret = start;
					select(false);
					_input.appendChar(undefined, start, length);
					_input.caret(caret);
				}
				break;
			case 9://Tab
			case 27://Escape
				_input.focus(false);
				break;
			case 35://End
				caret = Number.MAX_VALUE;
				select(e.shiftKey, _input.caret(), caret);
				_input.caret(caret);
				break;
			case 36://Home
				caret = 0;
				select(e.shiftKey, _input.caret(), caret);
				_input.caret(caret);
				break;
			case 37://Arrow left
				if(e.ctrlKey || e.metaKey) {
					caret = _input.prevBoundary(caret - 1);
				} else {
					caret--;
				}
				select(e.shiftKey, _input.caret(), caret);
				_input.caret(caret);
				break;
			case 38://Arrow up
				_input.jump(-1);
				select(e.shiftKey, caret, _input.caret());
				break;
			case 39://Arrow right
				if(e.ctrlKey || e.metaKey) {
					var nextBoundary = _input.nextBoundary(caret);
					if(nextBoundary != -1) {
						caret = nextBoundary + 1;
					} else {
						caret = Number.MAX_VALUE;
					}
				} else {
					caret++;
				}
				select(e.shiftKey, _input.caret(), caret);
				_input.caret(caret);
				break;
			case 40://Arrow down
				_input.jump(1);
				select(e.shiftKey, caret, _input.caret());
				break;
			case 46://Delete
				start = _selection.length()? _selection.start() : caret;
				length = Math.max(1, _selection.length());
				caret = start;
				select(false);
				_input.appendChar(undefined, start, length);
				_input.caret(caret);
				break;
			default:
				preventDefault = false;
				break;
		}
		if(preventDefault) e.preventDefault();
	}
}