import {Crosshairs} from './crosshairs.js';
import {animationUtils, genericUtils} from '../utils.js';
export class Teleport {
    constructor(tokens, controllingToken, options) {
        this.tokens = Array.isArray(tokens) ? tokens : [tokens];
        this.controllingToken = controllingToken ?? this.tokens[0];
        this.options = options;
        this.updates = options?.updates ?? {};
    }
    static async teleport(tokens, controllingToken, options = {animation: 'none', isSynchronous: 'true', crosshairsConfig: {}, callbacks: {}, range: 100, updates: {}}) {
        console.log(tokens, tokens.id, tokens.document.id);
        let teleport = new Teleport(tokens, controllingToken, options);
        await teleport.go();
    }
    async go() {
        if (this.controllingToken.actor?.sheet?.rendered) this.controllingToken.actor.sheet.minimize();
        this.template = await Crosshairs.showCrosshairs(this.crosshairsConfig, this.callbacks);
        this.callbacks?.post.bind(this)();
        await this._move();
        if (this.controllingToken.actor?.sheet?.rendered) this.controllingToken.actor.sheet.maximize();
    }
    async _move() {
        if (this.options?.isSynchronous === false) {
            await this._nonSync();
        } else {
            await this._sync();
        }
    }
    async _nonSync() {
        this.tokens.forEach(async tok => {
            //play sequence
            let update = genericUtils.collapseObjects(this.updates, this.getCoords(tok), {_id: tok.id});
            await genericUtils.updateEmbeddedDocuments(canvas.scene, 'Token', [update], {animate: false});
            // play sequence
        });
    }
    async _sync() {
        // play sequence
        //await Promise.all(this.tokens.map(async tok => sequenceCallback(tok)))
        let updates = this.tokens.map(tok => genericUtils.collapseObjects(this.updates, {_id: tok.id}, this.getCoords(tok)));
        console.log(this.coords, updates);
        await genericUtils.updateEmbeddedDocuments(canvas.scene, 'Token', updates, {animate: false});
        console.log('hello??');
        // play sequnce
        //await Promise.all(this.tokens.map(async tok => sequenceCallback(tok)))
    }
    getCoords(token) {
        let difference = {
            x: this.controllingToken.x - token.x, 
            y: this.controllingToken.y - token.y
        };
        let update = {
            rotation: this.template.direction,
            x: this.coords.selected.x - difference.x,
            y: this.coords.selected.y - difference.y
        };
        return update;
    }
    get callbacks() {
        if (!this.options?.callbacks?.show) {
            this.options.callbacks = {show: undefined};
            this.options.callbacks.show = async (crosshairs) => {
                if (!this?.drawing) {
                    let radius = (canvas.grid.size * (this.options.range / canvas.grid.distance) + canvas.grid.size / 2);
                    this.drawing = new PIXI.Graphics();
                    this.drawing.beginFill(0xffffff);
                    if (game.settings.get('core', 'gridDiagonals') === 0) {
                        this.drawing.drawRect(this.controllingToken.center.x - radius, this.controllingToken.center.y - radius, radius * 2, radius * 2);
                    } else {
                        this.drawing.drawCircle(this.controllingToken.center.x, this.controllingToken.center.y, radius);
                    }
                    this.drawing.beginHole();
                    if (game.settings.get('core', 'gridDiagonals') === 0) {
                        this.drawing.drawRect(this.controllingToken.center.x - radius + 5, this.controllingToken.center.y - radius + 5, radius * 2 - 10, radius * 2 - 10);
                    } else {
                        this.drawing.drawCircle(this.controllingToken.center.x, this.controllingToken.center.y, radius - 5);
                    }
                    this.drawing.endHole();
                    this.drawing.endFill();
                    this.drawing.tint = 0x32cd32;
                    this.containter = new PIXI.Container();
                    this.containter.addChild(this.drawing);
                    canvas.drawings.addChild(this.containter);
                }
                let distance = 0;
                let ray;
                while (crosshairs.inFlight) {
                    await genericUtils.sleep(100);
                    ray = new Ray(this.controllingToken.center, crosshairs);
                    distance = canvas.grid.measureDistances([{ray}], {'gridSpaces': true})[0];
                    if (this.controllingToken.checkCollision(ray.B, {'origin': ray.A, 'type': 'move', 'mode': 'any'}) || distance > this.options.range) {
                        crosshairs.icon = 'icons/svg/hazard.svg';
                        this.drawing.tint = 0xff0000;
                    } else {
                        crosshairs.icon = this.controllingToken.document.texture.src;
                        this.drawing.tint = 0x32cd32;
                    }
                    crosshairs.draw();
                    crosshairs.label = distance + '/' + this.options.range + 'ft.';
                }
            };
            this.options.callbacks.post = function clearDrawing() {
                console.log('umh, hi?', this);
                this.drawing.destroy();
            };
        }
        return this.options.callbacks;
    }
    get crosshairsConfig() {
        let config = {
            size: this.controllingToken.document.width * 2,
            icon: this.controllingToken.document.texture.src,
            resolution: this.updates?.token?.width ?? this.controllingToken.w % 2 === 0 ? 1 : -1
        };
        return genericUtils.collapseObjects(Crosshairs.defaultCrosshairsConfig(), config, this.options?.crosshairsConfig ?? {});
    }
    get coords() {
        console.log(this.controllingToken, this.template, this?.template?.x ?? 0 - (canvas.scene.grid.sizeX * this.controllingToken.w / 2));
        return {
            original: {
                x: this.controllingToken.x,
                y: this.controllingToken.y,
            },
            selected: {
                x: this?.template?.x - (this.controllingToken.w / 2),
                y: this?.template?.y - (this.controllingToken.h / 2),
            }
        };
    }
}