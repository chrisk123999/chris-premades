import {Crosshairs} from './crosshairs.js';
import {animationUtils, genericUtils} from '../utils.js';
import {crosshairUtils} from './utilities/crosshairUtils.js';
export class Teleport {
    constructor(tokens, controllingToken, options) {
        this.tokens = Array.isArray(tokens) ? tokens : [tokens];
        this.controllingToken = controllingToken ?? this.tokens[0];
        this.tokenTexture = this.tokens[0].document.texture.src;
        this.options = options;
        this.updates = options?.updates ?? {};
    }
    static async group(tokens, controllingToken, options = {animation: 'none', isSynchronous: true, crosshairsConfig: {}, callbacks: {}, range: 100, updates: {}, minimizeSheet: true}) {
        genericUtils.setProperty(options, 'isGroup', true);
        let teleport = new Teleport(tokens, controllingToken, options);
        teleport.tokenTexture = controllingToken.document.texture.src;
        await teleport.go(teleport.crosshairsConfig, options.minimizeSheet);
    }
    static async target(target, controllingToken, options = {animation: 'none', crosshairsConfig: {}, callbacks: {}, range: 100, updates: {}, minimizeSheet: true}) {
        let teleport = new Teleport(target, controllingToken, options);
        await teleport.go(teleport.crosshairsConfigTarget, options.minimizeSheet);
    }
    async go(crosshairsConfig, minimizeSheet = true) {
        if (this.controllingToken.actor?.sheet?.rendered && minimizeSheet) this.controllingToken.actor.sheet.minimize();
        this.template = await crosshairUtils.aimCrosshair({
            token: this.controllingToken,
            maxRange: this.options.range,
            crosshairsConfig,
            drawBoundries: true,
            customCallbacks: this.callbacks
        });
        if (!this.template.cancelled) {
            this.options?.isGroup ? await this._moveGroup() : await this._move();
        }
        if (this.controllingToken.actor?.sheet?.rendered && minimizeSheet) this.controllingToken.actor.sheet.maximize();
    }
    async _move() {
        let tok = this.tokens[0];
        let position = {
            rotation: this.template.direction,
            x: this.coords.selected.x,
            y: this.coords.selected.y
        };
        await animationUtils.teleportEffects[this.options?.animation ?? 'default'].pre(tok.document, position);
        let update = genericUtils.collapseObjects(this.updates, position, {_id: tok.id});
        await genericUtils.updateEmbeddedDocuments(canvas.scene, 'Token', [update], {animate: false});
        await animationUtils.teleportEffects[this.options?.animation ?? 'default'].post(tok.document, position);
    }
    async _moveGroup() {
        if (this.options?.isSynchronous === false) {
            await this._nonSync();
        } else {
            await this._sync();
        }
    }
    async _nonSync() {
        this.tokens.forEach(async tok => {
            let position = this.getCoords(tok);
            await animationUtils.teleportEffects[this.options?.animation ?? 'default'].pre(tok.document, position);
            let update = genericUtils.collapseObjects(this.updates, position, {_id: tok.id});
            await genericUtils.updateEmbeddedDocuments(canvas.scene, 'Token', [update], {animate: false});
            await animationUtils.teleportEffects[this.options?.animation ?? 'default'].post(tok.document, position);
        });
    }
    async _sync() {
        let positions = this.tokens.map(tok => this.getCoords(tok));
        await Promise.all(this.tokens.map(async (tok, ind) => await animationUtils.teleportEffects[this.options?.animation ?? 'default'].pre(tok.document, positions[ind])));
        let updates = this.tokens.map((tok, ind) => genericUtils.collapseObjects(this.updates, {_id: tok.id}, positions[ind]));
        await genericUtils.updateEmbeddedDocuments(canvas.scene, 'Token', updates, {animate: false});
        await Promise.all(this.tokens.map(async (tok, ind) => await animationUtils.teleportEffects[this.options?.animation ?? 'default'].post(tok.document, positions[ind])));
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
    get crosshairsConfig() {
        let config = {
            size: this.controllingToken.document.width * 2,
            icon: this.tokenTexture,
            resolution: this.updates?.token?.width ?? this.controllingToken.w % 2 === 0 ? 1 : -1
        };
        return genericUtils.collapseObjects(Crosshairs.defaultCrosshairsConfig(), config, this.options?.crosshairsConfig ?? {});
    }
    get crosshairsConfigTarget() {
        let config = {
            size: this.tokens[0].document.width * 2,
            icon: this.tokenTexture,
            resolution: this.updates?.token?.width ?? this.tokens[0].w % 2 === 0 ? 1 : -1
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
                x: this?.template?.x - (this.controllingToken.w / 2),
                y: this?.template?.y - (this.controllingToken.h / 2),
            }
        };
    }
}