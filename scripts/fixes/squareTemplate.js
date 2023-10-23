function patch() {
    if (game.modules.get('df-templates')?.active) return;
    libWrapper.register('chris-premades', 'MeasuredTemplate.prototype._getRectShape', MeasuredTemplate_getRectShape, 'OVERRIDE');
    libWrapper.register('chris-premades', 'MeasuredTemplate.prototype._refreshRulerText', MeasuredTemplate_refreshRulerText, 'WRAPPER');
}
function unPatch() {
    if (game.modules.get('df-templates')?.active) return;
    libWrapper.unregister('chris-premades', 'MeasuredTemplate.prototype._getRectShape', false);
    libWrapper.unregister('chris-premades', 'MeasuredTemplate.prototype._refreshRulerText', false);
}
function MeasuredTemplate_getRectShape(direction, distance, adjustForRoundingError = false) {
    // Generate a rotation matrix to apply the rect against. The base rotation must be rotated
    // CCW by 45° before applying the real direction rotation.
    const matrix = PIXI.Matrix.IDENTITY.rotate((-45 * (Math.PI / 180)) + direction);
    // If the shape will be used for collision, shrink the rectangle by a fixed EPSILON amount to account for rounding errors
    const EPSILON = adjustForRoundingError ? 0.0001 : 0;
    // Use simple Pythagoras to calculate the square's size from the diagonal "distance".
    const size = Math.sqrt((distance * distance) / 2) - EPSILON;
    // Create the square's 4 corners with origin being the Top-Left corner and apply the
    // rotation matrix against each.
    const topLeft = matrix.apply(new PIXI.Point(EPSILON, EPSILON));
    const topRight = matrix.apply(new PIXI.Point(size, EPSILON));
    const botLeft = matrix.apply(new PIXI.Point(EPSILON, size));
    const botRight = matrix.apply(new PIXI.Point(size, size));
    // Inject the vector data into a Polygon object to create a closed shape.
    const shape = new PIXI.Polygon([topLeft.x, topLeft.y, topRight.x, topRight.y, botRight.x, botRight.y, botLeft.x, botLeft.y, topLeft.x, topLeft.y]);
    // Add these fields so that the Sequencer mod doesn't have a stroke lol
    shape.x = topLeft.x;
    shape.y = topLeft.y;
    shape.width = size;
    shape.height = size;
    return shape;
}
function MeasuredTemplate_refreshRulerText(wrapped) {
    wrapped();
    // Overwrite the text for the "rect" type
    if (this.document.t === 'rect') {
        // Use simple Pythagoras to calculate the square's size from the diagonal "distance".
        const size = Math.sqrt((this.document.distance * this.document.distance) / 2).toFixed(1);
        const text = `${size}${canvas.scene.grid.units}`;
        (this).ruler.text = text;
    }
}
export let squareTemplate = {
    'patch': patch,
    'unpatch': unPatch
}