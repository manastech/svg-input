function KeyTracker(input) {

  var self = this;
  var _active = false;
  var _input;
  var _container;
  var _hiddenInput;
  var _isMac;
  var BACKSPACE = 8;
  var TAB = 9;
  var ESCAPE = 27;
  var ENTER = 13;
  var END = 35;
  var HOME = 36;
  var ARROW_LEFT = 37;
  var ARROW_UP = 38;
  var ARROW_RIGHT = 39;
  var ARROW_DOWN = 40;
  var DELETE = 46;
  var DIACRITICAL_MARKS = /[\u005E\u0060\u00A8\u00B4\u02C6\u02CA\u02CB\u02CE\u02CF\u02DD\u02DF\u02F4\u02F5\u02F6\u0953\u0954\u1DC0-\u1DE6\u0300-\u036F\u0591-\u05AE]/;

  function init(input) {
    _input = input;
    _container = _input.container();
    _isMac = navigator.platform.match(/(Mac|iPhone|iPod|iPad)/i)? true : false;
    _hiddenInput = document.createElement("input")
    var hiddenInputContainer = _container.appendChild(document.createElement("div"));
    hiddenInputContainer.style.opacity = 0;
    hiddenInputContainer.style.width = 0;
    hiddenInputContainer.style.height = 0;
    hiddenInputContainer.style.overflows = "hidden";
    hiddenInputContainer.style.pointerEvents = "none";
    hiddenInputContainer.appendChild(_hiddenInput);
  }

  self.activate = function() {
    _active = true;
    _hiddenInput.focus();
    _hiddenInput.select();
    _hiddenInput.addEventListener("keypress", keyPressHandler);
    _hiddenInput.addEventListener("keydown", keyDownHandler);
    _hiddenInput.addEventListener("input", inputHandler);
  }

  self.deactivate = function() {
    _active = false;
    _hiddenInput.removeEventListener("keypress", keyPressHandler);
    _hiddenInput.removeEventListener("keydown", keyDownHandler);
    _hiddenInput.removeEventListener("input", inputHandler);
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

  function insert(string) {
      var chars = string.split("");
      chars.forEach(function (char) {
        insertFromCharCode(char.charCodeAt(0));
      })
  }

  function insertFromCharCode(charCode) {
    var start = _input.selection().length()? _input.selection().start() : _input.caret();
    var remove = _input.selection().length();
    var char = String.fromCharCode(charCode);
    _input.selection().clear();
    _input.append(start, remove, char);
    _input.caret(start + 1, charCode != ENTER);
  }

  function getKeyCode(e) {
    return e.which? e.which : (e.keyCode? e.keyCode : (e.charCode? e.charCode : 0));
  }

  function keyPressHandler(e) {
    var keyCode = getKeyCode(e);
    switch(keyCode) {
      case ENTER:
        break;
      default:
        insertFromCharCode(keyCode);
        break;
    }
    e.preventDefault();
  }

  function keyDownHandler(e) {
    var keyCode = getKeyCode(e);
    var start, remove;
    var caret = _input.caret();
    var preventDefault = true;
    switch(keyCode) {
      case BACKSPACE:
        if(caret || _input.selection().length()) {
          start = _input.selection().length()? _input.selection().start() : caret - 1;
          remove = Math.max(1, _input.selection().length());
          caret = start;
          select(false);
          _input.append(start, remove);
          _input.caret(caret);
        }
        break;
      case TAB:
      case ESCAPE:
        _input.focus(false);
        break;
      case ENTER:
        insertFromCharCode(keyCode);
        break;
      case END:
        caret = Number.MAX_VALUE;
        select(e.shiftKey, _input.caret(), caret);
        _input.caret(caret);
        break;
      case HOME:
        caret = 0;
        select(e.shiftKey, _input.caret(), caret);
        _input.caret(caret);
        break;
      case ARROW_LEFT:
        if((_isMac && e.altKey) || (!_isMac && e.ctrlKey)) {
          caret = _input.prevBoundary(caret - 1);
        } else {
          caret--;
        }
        select(e.shiftKey, _input.caret(), caret);
        _input.caret(caret);
        break;
      case ARROW_UP:
        _input.jump(-1);
        select(e.shiftKey, caret, _input.caret());
        break;
      case ARROW_RIGHT:
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
      case ARROW_DOWN:
        _input.jump(1);
        select(e.shiftKey, caret, _input.caret());
        break;
      case DELETE:
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

  function inputHandler(e) {
    var deadKey = DIACRITICAL_MARKS.test(_hiddenInput.value) && _hiddenInput.value.length == 1;
    if(!deadKey) {
      insert(_hiddenInput.value);
      _hiddenInput.value = "";
    }
  }

  init(input);
}
