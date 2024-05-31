let gridSnappingModes = {
    'CENTER': 1,
    'EDGE_MIDPOINT': 2,
    'TOP_LEFT_VERTEX': 16,
    'TOP_RIGHT_VERTEX': 32,
    'BOTTOM_LEFT_VERTEX': 64,
    'BOTTOM_RIGHT_VERTEX': 128,
    'VERTEX': 240,
    'TOP_LEFT_CORNER': 256,
    'TOP_RIGHT_CORNER': 512,
    'BOTTOM_LEFT_CORNER': 1024,
    'BOTTOM_RIGHT_CORNER': 2048,
    'CORNER': 3840,
    'TOP_SIDE_MIDPOINT': 4096,
    'BOTTOM_SIDE_MIDPOINT': 8192,
    'LEFT_SIDE_MIDPOINT': 16384,
    'RIGHT_SIDE_MIDPOINT': 32768,
    'SIDE_MIDPOINT': 61440
};
// eslint-disable-next-line no-undef
export class Crosshairs extends MeasuredTemplate {

    //constructor(gridSize = 1, data = {}){
    constructor(config, callbacks = {}) {
        const templateData = {
            t: config.t ?? 'circle',
            user: game.user.id,
            distance: config.size,
            x: config.x,
            y: config.y,
            document: {
                fillColor: config.fillColor,
            },
            width: 1,
            texture: config.texture,
            direction: config.direction,
        };
  
        const template = new CONFIG.MeasuredTemplate.documentClass(templateData, {parent: canvas.scene});
        super(template);
  
        /** @TODO all of these fields should be part of the source data schema for this class **/
        /**  image path to display in the center (under mouse cursor) */
        this.icon = config.icon ?? Crosshairs.ERROR_TEXTURE;
  
        /** text to display below crosshairs' circle */
        this.label = config.label;
  
        /** Offsets the default position of the label (in pixels) */
        this.labelOffset = config.labelOffset;
  
        /**
       * Arbitrary field used to identify this instance
       * of a Crosshairs in the canvas.templates.preview
       * list
       */
        this.tag = config.tag;
  
        /** Should the center icon be shown? */
        this.drawIcon = config.drawIcon;
  
        /** Should the outer circle be shown? */
        this.drawOutline = config.drawOutline;
  
        /** Opacity of the fill color */
        this.fillAlpha = config.fillAlpha;
  
        /** Should the texture (if any) be tiled
       * or scaled and offset? */
        this.tileTexture = config.tileTexture;
  
        /** locks the size of crosshairs (shift+scroll) */
        this.lockSize = config.lockSize;
  
        /** locks the position of crosshairs */
        this.lockPosition = config.lockPosition;
  
        /** Number of quantization steps along
       * a square's edge (N+1 snap points 
       * along each edge, conting endpoints)
       */
        this.interval = config.interval;
  
        /** Callback functions to execute
       * at particular times
       */
        this.callbacks = callbacks;
  
        /** Indicates if the user is actively 
       * placing the crosshairs.
       * Setting this to true in the show
       * callback will stop execution
       * and report the current mouse position
       * as the chosen location
       */
        this.inFlight = false;
  
        /** indicates if the placement of
       * crosshairs was canceled (with
       * a right click)
       */
        this.cancelled = true;
  
        /**
       * Indicators on where cancel was initiated
       * for determining if it was a drag or a cancel
       */
        this.rightX = 0;
        this.rightY = 0;
  
        /** @type {number} */
        this.radius = this.document.distance * this.scene.grid.size / 2;
    }
  
    /**
     * @returns {CrosshairsData} Current Crosshairs class data
     */
    toObject() {
  
        /** @type {CrosshairsData} */
        const data = foundry.utils.mergeObject(this.document.toObject(), {
            cancelled: this.cancelled,
            scene: this.scene,
            radius: this.radius,
            size: this.document.distance,
        });
        delete data.width;
        return data;
    }
  
    static ERROR_TEXTURE = 'icons/svg/hazard.svg';
  
    /**
     * Will retrieve the active crosshairs instance with the defined tag identifier.
     * @param {string} key Crosshairs identifier. Will be compared against the Crosshairs `tag` field for strict equality.
     * @returns {PIXI.DisplayObject|undefined}
     */
    static getTag(key) {
        return canvas.templates.preview.children.find( child => child.tag === key );
    }
  
    static getSnappedPosition({x,y}, interval){
        const offset = interval < 0 ? canvas.grid.size/2 : 0;
        const snapped = canvas.grid.getSnappedPoint({x: x - offset, y: y - offset}, {mode: 1, resolution: interval});
        //const snapped = 
        return {x: snapped.x + offset, y: snapped.y + offset};
    }
    /* -----------EXAMPLE CODE FROM MEASUREDTEMPLATE.JS--------- */
    /* Portions of the core package (MeasuredTemplate) repackaged 
     * in accordance with the "Limited License Agreement for Module 
     * Development, found here: https://foundryvtt.com/article/license/ 
     * Changes noted where possible
     */
  
    /**
     * Set the displayed ruler tooltip text and position
     * @private
     */
    //BEGIN WARPGATE
    _setRulerText() {
        this.ruler.text = this.label;
        /** swap the X and Y to use the default dx/dy of a ray (pointed right)
      //to align the text to the bottom of the template */
        this.ruler.position.set(-this.ruler.width / 2 + this.labelOffset.x, this.template.height / 2 + 5 + this.labelOffset.y);
        //END WARPGATE
    }
  
    /** @override */
    async draw() {
        this.clear();
  
        // Load the texture
        const texture = this.document.texture;
        if ( texture ) {
            // eslint-disable-next-line no-undef
            this._texture = await loadTexture(texture, {fallback: 'icons/svg/hazard.svg'});
        } else {
            this._texture = null;
        }
  
        // Template shape
        this.template = this.addChild(new PIXI.Graphics());
  
        // Rotation handle
        //BEGIN WARPGATE
        //this.handle = this.addChild(new PIXI.Graphics());
        //END WARPGATE
  
        // Draw the control icon
        //if(this.drawIcon) 
        this.controlIcon = this.addChild(this._drawControlIcon());
  
        // Draw the ruler measurement
        this.ruler = this.addChild(this._drawRulerText());
  
        // Update the shape and highlight grid squares
        this.refresh();
        //BEGIN WARPGATE
        this._setRulerText();
        //this.highlightGrid();
        //END WARPGATE
  
        // Enable interactivity, only if the Tile has a true ID
        if ( this.id ) this.activateListeners();
        return this;
    }
  
    /**
     * Draw the Text label used for the MeasuredTemplate
     * @return {PreciseText}
     * @protected
     */
    _drawRulerText() {
        const style = CONFIG.canvasTextStyle.clone();
        style.fontSize = Math.max(Math.round(canvas.dimensions.size * 0.36 * 12) / 12, 36);
        // eslint-disable-next-line no-undef
        const text = new PreciseText(null, style);
        //BEGIN WARPGATE
        //text.anchor.set(0.5, 0);
        text.anchor.set(0, 0);
        //END WARPGATE
        return text;
    }
  
    /**
     * Draw the ControlIcon for the MeasuredTemplate
     * @return {ControlIcon}
     * @protected
     */
    _drawControlIcon() {
        const size = Math.max(Math.round((canvas.dimensions.size * 0.5) / 20) * 20, 40);
  
        //BEGIN WARPGATE
        // eslint-disable-next-line no-undef
        let icon = new ControlIcon({texture: this.icon, size: size});
        icon.visible = this.drawIcon;
        //END WARPGATE
  
        icon.pivot.set(size*0.5, size*0.5);
        //icon.x -= (size * 0.5);
        //icon.y -= (size * 0.5);
        icon.angle = this.document.direction;
        return icon;
    }
  
    /** @override */
    refresh() {
        if (!this.template || this._destroyed) return;
        let d = canvas.dimensions;
        const document = this.document;
        this.position.set(document.x, document.y);
  
        // Extract and prepare data
        let {direction, distance} = document;
        distance *= (d.size/2);
        //BEGIN WARPGATE
        //width *= (d.size / d.distance);
        //END WARPGATE
        direction = Math.toRadians(direction);
  
        // Create ray and bounding rectangle
        this.ray = Ray.fromAngle(document.x, document.y, direction, distance);
  
        // Get the Template shape
        this.shape = this.compat('crosshairs.computeShape', this);
  
        // Draw the Template outline
        this.template.clear()
            .lineStyle(this._borderThickness, this.document.borderColor, this.drawOutline ? 0.75 : 0);
  
        // Fill Color or Texture
  
        if (this._texture) {
        /* assume 0,0 is top left of texture
         * and scale/offset this texture (due to origin
         * at center of template). tileTexture indicates
         * that this texture is tilable and does not 
         * need to be scaled/offset */
            const scale = this.tileTexture ? 1 : distance * 2 / this._texture.width;
            const offset = this.tileTexture ? 0 : distance;
            this.template.beginTextureFill({
                texture: this._texture,
                matrix: new PIXI.Matrix().scale(scale, scale).translate(-offset, -offset)
            });
        } else {
            this.template.beginFill(this.document.fillColor, this.fillAlpha);
        }
  
        // Draw the shape
        this.template.drawShape(this.shape);
  
        // Draw origin and destination points
        //BEGIN WARPGATE
        //this.template.lineStyle(this._borderThickness, 0x000000, this.drawOutline ? 0.75 : 0)
        //  .beginFill(0x000000, 0.5)
        //.drawCircle(0, 0, 6)
        //.drawCircle(this.ray.dx, this.ray.dy, 6);
        //END WARPGATE
  
        // Update visibility
        if (this.drawIcon) {
            this.controlIcon.visible = true;
            this.controlIcon.border.visible = this._hover;
            this.controlIcon.angle = document.direction;
        }
  
        // Draw ruler text
        //BEGIN WARPGATE
        this._setRulerText();
        //END WARPGATE
        return this;
    }
  
    /* END MEASUREDTEMPLATE.JS USAGE */
  
  
    /* -----------EXAMPLE CODE FROM ABILITY-TEMPLATE.JS--------- */
    /* Foundry VTT 5th Edition
     * Copyright (C) 2019  Foundry Network
     *
     * This program is free software: you can redistribute it and/or modify
     * it under the terms of the GNU General Public License as published by
     * the Free Software Foundation, either version 3 of the License, or
     * (at your option) any later version.
     *
     * This program is distributed in the hope that it will be useful,
     * but WITHOUT ANY WARRANTY; without even the implied warranty of
     * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
     * GNU General Public License for more details.
     *
     * Original License: 
     * https://gitlab.com/foundrynet/dnd5e/-/blob/master/LICENSE.txt
     */
  
    /**
     * Creates a preview of the spell template
     */
  
    get layer() {
        return canvas.activeLayer;
    }
  
    async drawPreview() {
        // Draw the template and switch to the template layer
        //this.initialLayer = canvas.activeLayer;
        //this.layer.activate();
        await this.draw();
        this.layer.preview.addChild(this);
        this.layer.interactiveChildren = false;
  
        // Hide the sheet that originated the preview
        //BEGIN WARPGATE
        this.inFlight = true;
  
        // Activate interactivity
        this.activatePreviewListeners();
  
        // Callbacks
        this.callbacks?.show?.(this);
  
        /* wait _indefinitely_ for placement to be decided. */
        await this.waitFor(() => !this.inFlight, -1);
        if (this.activeHandlers) {
            this.clearHandlers();
        }
  
        //END WARPGATE
        return this;
    }
  
    /* -------------------------------------------- */
  
    _mouseMoveHandler(event) {
        event.stopPropagation();
  
        /* if our position is locked, do not update it */
        if (this.lockPosition) return;
  
        // Apply a 20ms throttle
        let now = Date.now();
        if (now - this.moveTime <= 20) return;
  
        const center = event.data.getLocalPosition(this.layer);
        const {x,y} = Crosshairs.getSnappedPosition(center, this.interval);
        this.document.updateSource({x, y});
        this.refresh();
        this.moveTime = now;
  
        if(now - this.initTime > 1000){
            //logger.debug(`1 sec passed (${now} - ${this.initTime}) - panning`);
            canvas._onDragCanvasPan(event.data.originalEvent);
        }
    }
  
    _leftClickHandler(event) {
        event.preventDefault();
  
        const document = this.document;
        const thisSceneSize = this.scene.grid.size;
  
        const destination = Crosshairs.getSnappedPosition(this.document, this.interval);
        this.radius = document.distance * thisSceneSize / 2;
        this.cancelled = false;
  
        this.document.updateSource({ ...destination });
      
        this.clearHandlers(event);
        return true;
    }
  
    // Rotate the template by 3 degree increments (mouse-wheel)
    // none = rotate 5 degrees
    // shift = scale size
    // ctrl = rotate 30 or 15 degrees (square/hex)
    // alt = zoom canvas
    _mouseWheelHandler(event) {
  
        if (event.ctrlKey) event.preventDefault(); // Avoid zooming the browser window
        if (!event.altKey) event.stopPropagation();
  
        const delta = canvas.grid.type > CONST.GRID_TYPES.SQUARE ? 30 : 15;
        const snap = event.ctrlKey ? delta : 5;
        //BEGIN WARPGATE
        const document = this.document;
        const thisSceneSize = this.scene.grid.size;
        if (event.shiftKey && !this.lockSize) {
            let distance = document.distance + 0.25 * (Math.sign(event.deltaY));
            distance = Math.max(distance, 0.25);
            this.document.updateSource({ distance });
            this.radius = document.distance * thisSceneSize / 2;
        } else if (!event.altKey) {
            const direction = document.direction + (snap * Math.sign(event.deltaY));
            this.document.updateSource({ direction });
        }
        //END WARPGATE
        this.refresh();
    }
  
    _rightDownHandler(event) {
        if (event.button !== 2) return;
  
        this.rightX = event.screenX;
        this.rightY = event.screenY;
    }
  
    _rightUpHandler(event) {
        if (event.button !== 2) return;
  
        const isWithinThreshold = (current, previous) => Math.abs(current - previous) < 10;
        if (isWithinThreshold(this.rightX, event.screenX)
        && isWithinThreshold(this.rightY, event.screenY)
        ) {
            this.cancelled = true;
            this.clearHandlers(event);
        }
    }
  
    /* Disable left drag monitoring */
    //_onDragLeftStart(evt) {}
    //_onDragStart(evt) {}
    //_onDragLeftMove(evt) {}
  
    _clearHandlers(event) {
        this.template.destroy();
        this._destroyed = true;
        this.layer.preview.removeChild(this);
  
        this.inFlight = false;
      
        //WARPGATE BEGIN
        canvas.stage.off('mousemove', this.activeMoveHandler);
        canvas.stage.off('mousedown', this.activeLeftClickHandler);
        canvas.app.view.onmousedown = null;
        canvas.app.view.onmouseup = null;
        canvas.app.view.onwheel = null;
  
        // Show the sheet that originated the preview
        if (this.actorSheet) this.actorSheet.maximize();
        //WARPGATE END
  
        /* re-enable interactivity on this layer */
        canvas.mouseInteractionManager.reset({interactionData: true});
        this.layer.interactiveChildren = true;
    }
  
    /**
     * Activate listeners for the template preview
     */
    activatePreviewListeners() {
        this.moveTime =  0;
        this.initTime = Date.now();
        //BEGIN WARPGATE
        this.removeAllListeners();
        /* Activate listeners */
        this.activeMoveHandler = this._mouseMoveHandler.bind(this);
        this.activeLeftClickHandler = this._leftClickHandler.bind(this);
        this.rightDownHandler = this._rightDownHandler.bind(this);
        this.rightUpHandler = this._rightUpHandler.bind(this);
        this.activeWheelHandler = this._mouseWheelHandler.bind(this);
  
        this.clearHandlers = this._clearHandlers.bind(this);
  
        // Update placement (mouse-move)
        canvas.stage.on('mousemove', this.activeMoveHandler);
  
        // Confirm the workflow (left-click)
        canvas.stage.on('mousedown', this.activeLeftClickHandler);
  
        // Mouse Wheel rotate
        canvas.app.view.onwheel = this.activeWheelHandler;
  
        // Right click cancel
        canvas.app.view.onmousedown = this.rightDownHandler;
        canvas.app.view.onmouseup = this.rightUpHandler;
  
        // END WARPGATE
    }
    compat(shimId, root = globalThis) {
        const gen = game.release?.generation;
        switch (shimId) {
            case 'interaction.pointer':
                return gen < 11 ? root.canvas.app.renderer.plugins.interaction.mouse : canvas.app.renderer.events.pointer;
            case 'crosshairs.computeShape':
                return (
                    {
                        10: () => {
                            if (root.document.t != 'circle') {
                                //logger.error('Non-circular Crosshairs is unsupported!');
                            }
                            return root._getCircleShape(root.ray.distance);
                        },
                    }[gen] ?? (() => root._computeShape())
                )();
            case 'token.delta':
                return (
                    {
                        10: 'actorData',
                    }[gen] ?? 'delta'
                );
            default:
                return null;
        }
    }
    async waitFor(fn, maxIter = 600, iterWaitTime = 100) {
        let i = 0;
        const continueWait = (current, max) => {
            /* negative max iter means wait forever */
            if (maxIter < 0) return true;
    
            return current < max;
        };
    
        while (!fn(i, (i * iterWaitTime)) && continueWait(i, maxIter)) {
            i++;
            await this.wait(iterWaitTime);
        }
        return i === maxIter ? false : true;
    }
    async wait(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    static crosshairsConfig() {
        return {
            size: 1,
            icon: 'icons/svg/dice-target.svg',
            label: '',
            labelOffset: {
                x: 0,
                y: 0,
            },
            tag: 'crosshairs',
            drawIcon: true,
            drawOutline: true,
            interval: 2,
            fillAlpha: 0,
            tileTexture: false,
            lockSize: true,
            lockPosition: false,
            rememberControlled: false,

            //Measured template defaults
            texture: null,
            //x: 0,
            //y: 0,
            direction: 0,
            fillColor: game.user.color,
        };
    }
    /** END ABILITY-TEMPLATE.JS USAGE */
}