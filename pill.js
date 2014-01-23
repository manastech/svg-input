function Pill(id, text) {

	var self = this;
	var _x;
	var _y;
	var _id = "";
	var _text = "";
	var _source;
	var _text;
	var _background;
	var _index;
	var _block;
	var _line;
	var _focus;

	function init(id, text) {
		_source = document.createElementNS("http://www.w3.org/2000/svg", "g");
		_background = _source.appendChild(document.createElementNS("http://www.w3.org/2000/svg", "rect"));
		_background.setAttribute("rx", 5);
		_background.setAttribute("ry", 5);
		_text = _source.appendChild(document.createElementNS("http://www.w3.org/2000/svg", "text"));
		self.focus(false);
		self.text(text);
		self.move(0, 0);
		self.index(0);
		self.block(0);
		self.line(0);
	}

	self.focus = function(value) {
		if(!arguments.length) {
			return _focus;
		} else {
			_focus = value;
			_source.setAttribute("class", "pill" + (_focus? "-focus" : ""));
			_background.setAttribute("style", "fill:red;stroke:black;stroke-width:5;");
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

	self.block = function(value) {
		if(!arguments.length) {
			return _block;
		} else {
			_block = value;
			_source.setAttribute("data-block", _block);
		}
	}

	self.line = function(value) {
		if(!arguments.length) {
			return _line;
		} else {
			_line = value;
			_source.setAttribute("data-line", _line);
		}
	}

	self.id = function(value) {
		if(!arguments.length) {
			return _id;
		} else {
			_id = value;
			_source.setAttribute("data-id", _id);
		}
	}

	self.text = function(value) {
		if(!arguments.length) {
			return _text;
		} else {
			_text = value;
			_source.textContent = _text;
			var boundingBox = _source.getBBox();
			_background.setAttribute("width", boundingBox.width);
			_background.setAttribute("height", boundingBox.height);
		}
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
		return "pill";
	}

	self.toString = function() {
		return "(" + self.text() + ")";
	}

	init(id, text);
}