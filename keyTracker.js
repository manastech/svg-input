function KeyTracker(input) {

	var self = this;
	var _active = false;
	var _input;
	var _isMac;
	var _caps;

	function init(input) {
		_input = input;
		_isMac = navigator.platform.match(/(Mac|iPhone|iPod|iPad)/i)? true : false;
	}

	self.activate = function() {
		_active = true;
		document.addEventListener("keyup", keyUpHandler);
		document.addEventListener("keypress", keyPressHandler);
		document.addEventListener("keydown", keyDownHandler);
	}

	self.deactivate = function() {
		_active = false;
		document.removeEventListener("keyup", keyUpHandler);
		document.removeEventListener("keypress", keyPressHandler);
		document.removeEventListener("keydown", keyDownHandler);
	}

	function select(shift, from, to) {
		if(shift) {
			if(_input.selection().length()) {
				_input.selection().set(_input.selection().from(), to);
			} else {
				_input.selection().set(from, to);
			}
		} else {
			_input.selection().clear();
		}
	}

	function insert(charCode) {
		var start = _input.selection().length()? _input.selection().start() : _input.caret();
		var remove = _input.selection().length();
		var char = String.fromCharCode(charCode);
		_input.selection().clear();
		_input.append(start, remove, char);
		_input.caret(start + 1, charCode != 13);
	}

	function keyUpHandler(e) {
		console.log("key up", e.keyCode, _caps)
		//blur not working
		//on focus clear accent
		//_accent = acute | grave | caret | diaeresis | tilde
		//switch _accent, find matches, select accented char, if (_caps && !shift) || (!_caps && shift) toUpperCas(), default insert empty accent. clear accent
		//69 acute		'áéíóú
		//73 caret		^âêîôû
		//78 tilde		~ãõñ
		//85 diaeresis	"äëïöü
		//192 grave		`àèìòù
	}

	function keyPressHandler(e) {
		var keyCode = e.which? e.which : (e.keyCode? e.keyCode : (e.charCode? e.charCode : 0));
		var shiftKey = e.shiftKey || (e.modifiers && (e.modifiers & 4));
		var char = String.fromCharCode(keyCode);
		if ((char.toUpperCase() == char) && (char.toLowerCase() != char) && !shiftKey) {
			_caps = true;
		} else {
			_caps = false;
		}
		console.log("key press", keyCode)
		e.preventDefault();
		switch(keyCode) {
			case 13://Enter
				break;
			default:
				insert(keyCode);
				break;
		}
	}

	function keyDownHandler(e) {
		var start, remove;
		var caret = _input.caret();
		var preventDefault = true;
		console.log(e.keyCode, e.altKey, e)
		switch(e.keyCode) {
			case 8://Backspace
				if(caret || _input.selection().length()) {
					start = _input.selection().length()? _input.selection().start() : caret - 1;
					remove = Math.max(1, _input.selection().length());
					caret = start;
					select(false);
					_input.append(start, remove);
					_input.caret(caret);
				}
				break;
			case 9://Tab
			case 27://Escape
				_input.focus(false);
				break;
			case 13://Enter
				insert(e.keyCode);
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
				if((_isMac && e.altKey) || (!_isMac && e.ctrlKey)) {
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
				if((_isMac && e.altKey) || (!_isMac && e.ctrlKey)) {
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
				start = _input.selection().length()? _input.selection().start() : caret;
				remove = Math.max(1, _input.selection().length());
				caret = start;
				select(false);
				_input.append(start, remove);
				_input.caret(caret);
				break;
			default:
				preventDefault = false;
				break;
		}
		if(preventDefault) e.preventDefault();
	}

	init(input);
}