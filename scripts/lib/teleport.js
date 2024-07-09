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
            this.options.callbacks.show = async (crosshairs) => {
                let distance = 0;
                let ray;
                while (crosshairs.inFlight) {
                    await genericUtils.sleep(100);
                    ray = new Ray(this.controllingToken.center, crosshairs);
                    distance = canvas.grid.measureDistances([{ray}], {'gridSpaces': true})[0];
                    if (this.controllingToken.checkCollision(ray.B, {'origin': ray.A, 'type': 'move', 'mode': 'any'}) || distance > this.options.range) {
                        crosshairs.icon = 'icons/svg/hazard.svg';
                    } else {
                        crosshairs.icon = this.controllingToken.document.texture.src;
                    }
                    crosshairs.draw();
                    crosshairs.label = distance + '/' + this.options.range + 'ft.';
                }
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