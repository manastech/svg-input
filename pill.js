function Pill(id, text, opperator) {

	var self = this;
	var _x;
	var _y;
	var _id = "";
	var _text = "";
	var _source;
	var _text;
	var _displayText;
	var _opperator;
	var _label;
	var _background;
	var _index;
	var _focus;
	var _boundingBox;

	function init(id, text, displayText, opperator) {
		_source = document.createElementNS("http://www.w3.org/2000/svg", "g");
		_source.setAttribute("type", "pill");
		_source.setAttribute("z-index", "1");
		_background = _source.appendChild(document.createElementNS("http://www.w3.org/2000/svg", "rect"));
		_background.setAttribute("rx", 3);
		_background.setAttribute("ry", 3);
		_label = _source.appendChild(document.createElementNS("http://www.w3.org/2000/svg", "text"));
		_label.setAttribute("cursor", "move");
		self.focus(false);
		self.id(id);
		self.text(text);
		self.displayText(displayText);
		self.opperator(opperator);
		self.move(0, 0);
		self.index(0);
	}

	self.focus = function(value) {
		if(!arguments.length) {
			return _focus;
		} else {
			_focus = value;
			_label.setAttribute("class", "char" + (_focus? " char-focus" : ""));
			_background.setAttribute("class", "pill" + (_focus? " pill-focus" : ""));
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
			_label.innerHTML = (_displayText || _text) + "\u25BC";
			_boundingBox = undefined;
		}
	}

	self.displayText = function(value) {
		if(!arguments.length) {
			return _displayText;
		} else {
			_displayText = value;
			_label.innerHTML = (_displayText || _text) + "\u25BC";
			_boundingBox = undefined;
		}
	}

	self.opperator = function(value) {
		if(!arguments.length) {
			return _opperator;
		} else {
			_opperator = value;
		}
	}

	self.x = function(value) {
		if(!arguments.length) {
			return _x;
		} else {
			_x = value;
			_label.setAttribute("x", _x);
			_background.setAttribute("x", _x);
		}
	}

	self.y = function(value) {
		if(!arguments.length) {
			return _y;
		} else {
			_y = value;
			_label.setAttribute("y", _y);
			_background.setAttribute("y", _y);
		}
	}

	self.draw = function() {
		if(_boundingBox == undefined) {
			var padding = 2;
			_boundingBox = _label.getBBox();
			_label.setAttribute("transform", "translate(" + padding + ",0)");
			_label.setAttribute("width", _boundingBox.width);
			_boundingBox.width = _boundingBox.width + padding * 2;
			_background.setAttribute("width", _boundingBox.width);
			_background.setAttribute("height", _boundingBox.height);
			_background.setAttribute("transform", "translate(0," + (_boundingBox.y - _y) + ")");
		}
		return _boundingBox;
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

	init(id, text, opperator);
}