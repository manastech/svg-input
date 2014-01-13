function TextInput(containerId) {
	var self = this;
	this.width = 100;
	this.height = 100;
	this.container = document.getElementById(containerId);
	this.textDisplay = new TextDisplay();
	this.textDisplay.setSize(this.width, this.height);
	this.container.appendChild(this.textDisplay.svg);
	this.container.addEventListener("click", function(e) {self.clickHandler(e)});
	this.invalidate();
}

//call(this)

EventDispatcher.call(TextInput.prototype);
InvalidateElement.call(TextInput.prototype);

TextInput.prototype.setSize = function(width, height) {
	this.width = width;
	this.height = height;
	this.invalidate();
}

TextInput.prototype.render = function() {
	console.log("render")
}

TextInput.prototype.clickHandler = function(e) {
	var self = this;
	e.stopPropagation();
	this.textDisplay.setFocus(true);
	document.addEventListener("keydown", function(e) {self.keyDownHandler(e)});
	document.addEventListener("keydown", function(e) {self.keyDownHandler(e)});
	document.addEventListener("click", function(e) {self.clickOutsideHandler(e)});
}

TextInput.prototype.keyDownHandler = function(e) {
	console.log(e);
}

TextInput.prototype.clickOutsideHandler = function(e) {
	e.stopPropagation();
	this.textDisplay.setFocus(false);
	console.log("outside",)
	document.removeEventListener("keydown", this.keyDownHandler);
	document.removeEventListener("click", this.clickOutsideHandler);
}