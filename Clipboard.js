function Clipboard(input) {

	var self = this;
	var _input;
	var _active;
	var _clipboardContainer;
	var _clipboard;

	function init(input) {
		_input = input;
		_clipboardContainer = document.createElement("div");
		_clipboardContainer.id = "clipboard-container";
		_clipboard = _clipboardContainer.appendChild(document.createElement("textarea"));
		_clipboard.id = "clipboard";
	}

	self.activate = function() {
		_active = true;
		document.addEventListener("keydown", keyDownHandler);
		document.addEventListener("keyup", keyUpHandler);
	}

	self.deactivate = function() {
		_active = false;
		document.removeEventListener("keydown", keyDownHandler);
		document.removeEventListener("keyup", keyUpHandler);
	}

	function keyDownHandler(e) {
		var selection = (window.getSelection? window.getSelection().toString() : (document.selection? document.selection.createRange().text : "")).length > 0;
		if(!selection && (e.ctrlKey || e.metaKey)) {
			document.body.appendChild(_clipboardContainer);
			switch(e.keyCode) {
				case 65://A
					_input.selection().set(0, Number.MAX_VALUE);
					e.preventDefault();
					break;
				case 67://c
					break
				case 86://V
					_clipboardContainer.style.display = "block";
					_clipboardContainer.appendChild(_clipboard);
					_clipboard.focus();
					break;
			}
		}
	}

	function keyUpHandler(e) {
		if(e.target == _clipboard) {
			var start = _input.selection().length()? _input.selection().start() : _input.caret();
			var remove = _input.selection().length();
			_input.appendChar(_clipboard.value, start, remove);
			_input.caret(start + _clipboard.value.length)
			_input.selection().clear();
			_clipboard.value = "";
			document.body.removeChild(_clipboardContainer);
		}
	}

	init(input);
}
		