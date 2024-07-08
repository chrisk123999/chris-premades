import {Crosshairs} from './crosshairs.js';
import {animationUtils, genericUtils} from '../utils.js';
export class Teleport {
    constructor(tokens, controllingToken, options) {
        this.tokens = tokens;
        this.controllingToken = controllingToken;
        this.options = options;
        this.updates = options?.updates ?? {};
    }
    static async teleport(tokens, controllingToken, options = {animation: 'none', isSynchronous: 'true', crosshairsConfig: {}, callbacks: {}, range: 100, updates: {}}) {
        let teleport = new Teleport(tokens, controllingToken, options = {animation: 'none', isSynchronous: 'true', crosshairsConfig: {}, callbacks: {}, range: 100});
        if (controllingToken.actor?.sheet?.rendered) controllingToken.actor.sheet.minimize();
        teleport.template = await Crosshairs.showCrosshairs(teleport.crosshairsConfig, teleport.callbacks);
        
        if (controllingToken.actor?.sheet?.rendered) controllingToken.actor.sheet.maximize();
    }
    async _move() {
        if (this.options?.isSynchronous === false) {
            await this._nonSync();
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
        //await Promise.all(this.tokens.forEach(async tok => sequenceCallback(tok)))
        let updates = this.tokens.map(tok => genericUtils.collapseObjects(this.updates, this.getCoords(tok), {_id: tok.id}));
        await genericUtils.updateEmbeddedDocuments(canvas.scene, 'Token', [updates], {animate: false});
        // play sequnce
        //await Promise.all(this.tokens.forEach(async tok => sequenceCallback(tok)))
    }
    getCoords(token) {
        let difference = {
            x: this.coords.selected.x - token.x, 
            y: this.coords.selected.y - token.y
        };
        let update = {
            rotation: this.templateData.direction,
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
                    await warpgate.wait(100);
                    ray = new Ray(this.controllingToken.center, crosshairs);
                    distance = canvas.grid.measureDistances([{ray}], {'gridSpaces': true})[0];
                    if (this.controllingToken.checkCollision(ray.B, {'origin': ray.A, 'type': 'move', 'mode': 'any'}) || distance > this.options.range) {
                        crosshairs.icon = 'icons/svg/hazard.svg';
                    } else {
                        crosshairs.icon = this.controllingToken.texture.src;
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
            icon: this.controllingToken.texture.src,
            resolution: this.updates?.token?.width ?? this.controllingToken.width % 2 === 0 ? 1 : -1
        };
        return genericUtils.collapseObjects(Crosshairs.defaultCrosshairsConfig(), config, this.options?.crosshairsConfig ?? {});
    }
    get coords() {
        return {
            original: {
                x: this.controllingToken.x,
                y: this.controllingToken.y,
            },
            selected: {
                x: this?.template?.x ?? 0 - (canvas.scene.grid.sizeX * this.controllingToken.width / 2),
                y: this?.template?.y ?? 0 - (canvas.scene.grid.sizeY * this.controllingToken.height / 2),
            }
        };
    }
}