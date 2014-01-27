function Character(text) {

	var self = this;
	var _x;
	var _y;
	var _text = "";
	var _source;
	var _index;
	var _focus;

	function init(text) {
		_source = document.createElementNS("http://www.w3.org/2000/svg", "text");
		_source.setAttribute("type", "char");
		self.focus(false);
		self.text(text);
		self.move(0, 0);
		self.index(0);
	}

	self.focus = function(value) {
		if(!arguments.length) {
			return _focus;
		} else {
			_focus = value;
			_source.setAttribute("class", "char" + (_focus? " char-focus" : ""));
		}
	}

	self.index = function(value) {
		if(!arguments.length) {
			return _index;
		} else {
			_index = value;
			_source.setAttribute("data-index", _index);
		}
	}

	self.text = function(value) {
		if(!arguments.length) {
			return _text;
		} else {
			_text = value;
			_source.textContent = _text;
		}
	}

	self.toString = function() {
		return self.text();
	}

	self.x = function(value) {
		if(!arguments.length) {
			return _x;
		} else {
			_x = value;
			_source.setAttribute("x", _x);
		}
	}

	self.y = function(value) {
		if(!arguments.length) {
			return _y;
		} else {
			_y = value;
			_source.setAttribute("y", _y);
		}
	}

	self.draw = function(value) {
		if(!arguments.length) {
			var boundingBox = _source.getBBox();
			_source.setAttribute("width", boundingBox.width);
			return boundingBox;
		} else {
			_source.setAttribute("width", value);
		}
	}

	self.move = function(x, y) {
		self.x(x);
		self.y(y);
	}

	self.offset = function(x, y) {
		self.move(_x + x, _y + y);
	}

	self.source = function() {
		return _source;
	}

	self.type = function() {
		return "character";
	}

	init(text);
}