// Crosshairs w/ preview texture being the token, text above with distance available via callbacks, error texture if outside of range
// changes, merge actor prototype token with token updates, create token document, update token delta with actor updates
// const tokenDocument = await actor.getTokenDocument(foundry.utils.mergeObject(placement, tokenUpdates));
// tokenDocument.delta.updateSource(actorUpdates);
// eventually await canvas.scene.createEmbeddedDocuments

import {Crosshairs} from './crosshairs.js';
import {genericUtils, animationUtils} from '../utils.js';

export class Summons {
    constructor(sourceActor, tokenDocument, updates, originItem, summonerToken, options) {
        this.sourceActor = sourceActor;
        this.tokenDocument = tokenDocument;
        this.updates = updates;
        this.originItem = originItem;
        this.summonerToken = summonerToken;
        this.options = options;
        this.width = updates?.token?.width ?? tokenDocument.width;
        this.spawnOptions = {};
    }
    static async spawn(sourceActor, updates = {}, originItem, summonerToken, options = {duration: 3600, callbacks: undefined, range: 100, animation: 'default'}) {
        let tokenDocument = await sourceActor.getTokenDocument();
        let Summon = new Summons(sourceActor, tokenDocument, updates, originItem, summonerToken, options);
        await Summon.prepareData();
        this.mergeUpdates(this.summonEffect);
        await Summon._spawn();
        this.handleEffects();
    }
    static async socketSpawn(actorUuid, updates, sceneUuid) {
        let actor = await fromUuid(actorUuid);
        let actorUpdates = updates.actor;
        let tokenUpdates = updates.token;
        let tokenDocument = await actor.getTokenDocument(tokenUpdates);
        let scene = await fromUuid(sceneUuid);
        await tokenDocument.delta.updateSource(actorUpdates);
        let token = await genericUtils.createEmbeddedDocuments(scene, 'Token', [tokenDocument]);
        return token;
    }
    // Helper function to dismiss any summons on an effect, will have the effect name and an array of ids
    static async dismiss(trigger) {
        let effect = trigger.entity;
        let summons = effect.flags['chris-premades']?.summons?.ids[effect.name];
        if (!summons) return;
        await canvas.scene.deleteEmbeddedDocuments('Token', summons);
    }
    async prepareData() {
        if (this.summonerToken?.actor) {
            this.spawnOptions = {
                'controllingActor': this.summonerToken.actor,
                'crosshairs': {
                    'interval': this.width % 2 === 0 ? 1 : -1
                }
            };
        }
        if (this.options.animation != 'none' && !this.options.callbacks?.post) {
            let callbackFunction = animationUtils.summonEffects[this.options.animation];
            if (typeof callbackFunction === 'function' && animationUtils.jb2aCheck() === 'patreon' && animationUtils.aseCheck()) {
                this.options.callbacks.post = callbackFunction;
                genericUtils.setProperty(this.updates, 'token.alpha', 0);
            }
        }
        if (!this.options.callbacks?.show) {
            this.options.callbacks = {show: undefined};
            this.options.callbacks.show = async (crosshairs) => {
                let distance = 0;
                let ray;
                while (crosshairs.inFlight) {
                    await warpgate.wait(100);
                    ray = new Ray(this.summonerToken.center, crosshairs);
                    distance = canvas.grid.measureDistances([{ray}], {'gridSpaces': true})[0];
                    if (this.summonerToken.checkCollision(ray.B, {'origin': ray.A, 'type': 'move', 'mode': 'any'}) || distance > this.options.range) {
                        crosshairs.icon = 'icons/svg/hazard.svg';
                    } else {
                        crosshairs.icon = this.tokenDocument.texture.src;
                    }
                    crosshairs.draw();
                    crosshairs.label = distance + '/' + this.options.range + 'ft.';
                }
            };
        }
    }
    async _spawn() {
        let actorData = {
            ownership: {[game.user.id]: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER}
        };
        this.mergeUpdates({token: genericUtils.mergeObject(this.updates.token ?? {}, {actorData}, {overwrite:false})});
        console.log(this.tokenDocument);
        let tokenImg = this.tokenDocument.texture.src;
        let rotation = this.tokenUpdates?.rotation ?? this.tokenDocument?.rotation ?? 0;
        let crosshairsConfig = genericUtils.mergeObject(this.options?.crosshairs ?? {}, {
            size: this.tokenDocument.width * 2,
            icon: tokenImg,
            name: this.tokenDocument.name,
            direction: 0,
        }, {inplace: true, overwrite: false});
        crosshairsConfig.direction += rotation;
        const templateData = await Crosshairs.showCrosshairs(crosshairsConfig, this.callbacks);
        if (templateData.cancelled) {
            console.log('was cancelled, do something different');
        }
        mergeObject(this.updates, {token: {
            rotation: templateData.direction,
            x: templateData.x - (canvas.scene.grid.sizeX * this.tokenDocument.width / 2),
            y: templateData.y - (canvas.scene.grid.sizeY * this.tokenDocument.height / 2)
        }});
        this.mergeUpdates({actor: {flags: {'chris-premades': {summons: {control: {user: game.user.id, actor: this.summonerToken.actor.uuid}}}}}});
        if (game.user.can('TOKEN_CREATE')) {
            let tokenDocument = await this.sourceActor.getTokenDocument(this.tokenUpdates);
            await tokenDocument.delta.updateSource(this.actorUpdates);
            this.spawnedTokens = await genericUtils.createEmbeddedDocuments(canvas.scene, 'Token', [tokenDocument]);
        } else {
            console.log('socket spawn');
            // this.socketSpawn();
        }
        console.log(this.spawnedTokens);
        return this.spawnedTokens;
    }
    async handleEffects() {
        
    }
    mergeUpdates(updates) {
        this.updates = genericUtils.mergeObject(this.updates, updates);
    }
    get tokenUpdates() {
        return this.updates.token;
    }
    get actorUpdates() {
        return this.updates.actor;
    }
    get summonEffect() {
        return {
            'name': genericUtils.translate('CHRISPREMADES.Summons.SummonedCreature'),
            'icon': this.originItem.img,
            'duration': {
                'seconds': this.options.duration
            },
            'origin': this.originItem.uuid,
            'flags': {
                'chris-premades': {
                    'vae': {
                        'button': genericUtils.translate('CHRISPREMADES.Summons.DismissSummon')
                    }
                }
            }
        };
    }
    get casterEffect() {
        return {
            name: this.originItem.name,
            icon: this.originItem.img,
            duration: {
                seconds: this.options.duration
            },
            origin: this.originItem.uuid,
            flags: {
                'chris-premades': {
                    vae: {
                        button: genericUtils.translate('CHRISPREMADES.Summons.DismissSummon')
                    },
                    summons: {
                        ids: {
                            [this.originItem.name]: this.spawnedTokensIds 
                        }
                    }
                }
            }
        };
    }
    get spawnedTokensIds() {
        return this.spawnedTokens.map(i => i.id);
    }
    /*
    effect on caster to dismiss summon - flag with IDs
    effect on summon to dismiss effect on caster
    summon effect dependent on caster
    caster effect dependent on summon


    */
}
// Export for helper functions for macro call system.
export let summonUtils = {
    name: 'Summon Utils',
    version: '0.12.0',
    effect: [
        {
            pass: 'deleted',
            macro: Summons.dismiss,
            priority: 50
        }
    ],
};