// Crosshairs w/ preview texture being the token, text above with distance available via callbacks, error texture if outside of range
// changes, merge actor prototype token with token updates, create token document, update token delta with actor updates
// const tokenDocument = await actor.getTokenDocument(foundry.utils.mergeObject(placement, tokenUpdates));
// tokenDocument.delta.updateSource(actorUpdates);
// eventually await canvas.scene.createEmbeddedDocuments

import {Crosshairs} from './crosshairs.js';
import {genericUtils, animationUtils} from '../utils.js';

export class Summons {
    constructor(sourceActors,  updates, originItem, summonerToken, options) {
        this.sourceActors = sourceActors;
        this._updates = updates;
        this.originItem = originItem;
        this.summonerToken = summonerToken;
        this.options = options;
        this.spawnOptions = {};
        this.spawnedTokens = [];
        this.currentIndex = 0;
    }
    static async spawn(sourceActors, updates = [{}], originItem, summonerToken, options = {duration: 3600, callbacks: undefined, range: 100, animation: 'default'}) {
        if (!Array.isArray(sourceActors)) sourceActors = [sourceActors];
        if (!Array.isArray(updates)) updates = [updates];
        let Summon = new Summons(sourceActors, updates, originItem, summonerToken, options);
        await Summon.prepareAllData();
        await Summon.spawnAll();
        //this.handleEffects();
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
    async prepareAllData() {
        while (this.currentIndex != this.sourceActors.length) {
            await this.prepareData();
            this.currentIndex++;
        }
        this.currentIndex = 0;
    }
    async prepareData() {
        let tokenDocument = await this.sourceActor.getTokenDocument();
        if (this.summonerToken?.actor) {
            this.spawnOptions = {
                'controllingActor': this.summonerToken.actor,
                'crosshairs': {
                    'interval': this.updates?.token?.width ?? tokenDocument.width % 2 === 0 ? 1 : -1
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
    async spawnAll() {
        while (this.currentIndex != this.sourceActors.length) {
            await this._spawn();
            this.currentIndex++;
        }
        this.currentIndex = 0;
    }
    async _spawn() {
        let tokenDocument = await this.sourceActor.getTokenDocument();
        let actorData = {
            ownership: {[game.user.id]: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER}
        };
        let currentUpdates = this.updates;
        console.log(currentUpdates, currentUpdates?.token ?? {});
        this.mergeUpdates({token: genericUtils.mergeObject(currentUpdates.token ?? {}, {actorData}, {overwrite:false})});
        let tokenImg = tokenDocument.texture.src;
        let rotation = this.tokenUpdates?.rotation ?? tokenDocument.rotation ?? 0;
        let crosshairsConfig = genericUtils.mergeObject(this.options?.crosshairs ?? {}, {
            size: tokenDocument.width * 2,
            icon: tokenImg,
            name: tokenDocument.name,
            direction: 0,
        }, {inplace: true, overwrite: false});
        crosshairsConfig.direction += rotation;
        const templateData = await Crosshairs.showCrosshairs(crosshairsConfig, this.callbacks);
        if (templateData.cancelled) {
            console.log('was cancelled, do something different');
        }
        mergeObject(this.updates, {token: {
            rotation: templateData.direction,
            x: templateData.x - (canvas.scene.grid.sizeX * tokenDocument.width / 2),
            y: templateData.y - (canvas.scene.grid.sizeY * tokenDocument.height / 2)
        }});
        console.log(this.summonerToken);
        this.mergeUpdates({
            actor: {
                flags: {
                    'chris-premades': {
                        summons: {
                            control: {
                                user: game.user.id, 
                                actor: this.summonerToken.actor.uuid
                            }
                        }
                    }
                },
                effects: this.summonEffect
            }
        });
        if (game.user.can('TOKEN_CREATE')) {
            let tokenDocument = await this.sourceActor.getTokenDocument(this.tokenUpdates);
            await tokenDocument.delta.updateSource(this.actorUpdates);
            let spawnedToken = await genericUtils.createEmbeddedDocuments(canvas.scene, 'Token', [tokenDocument]);
            this.spawnedTokens.push(spawnedToken);
        } else {
            console.log('socket spawn');
            // this.socketSpawn();
        }
        console.log(this.spawnedTokens);
        return this.spawnedTokens;
    }
    async handleEffects() {
        // make the things dependent and whatnot
    }
    mergeUpdates(updates) {
        this.updates[this.currentIndex] = genericUtils.mergeObject(this.updates, updates);
    }
    get tokenUpdates() {
        return this.updates[this.currentIndex].token;
    }
    get actorUpdates() {
        return this.updates[this.currentIndex].actor;
    }
    get summonEffect() {
        return {
            name: genericUtils.translate('CHRISPREMADES.Summons.SummonedCreature'),
            icon: this.originItem.img,
            duration: {
                seconds: this.options.duration
            },
            origin: this.originItem.uuid,
            flags: {
                'chris-premades': {
                    vae: {
                        button: genericUtils.translate('CHRISPREMADES.Summons.DismissSummon')
                    }
                }
            }
        };
    }
    get casterEffect() {
        return {
            name: this.originItem.name,
            img: this.originItem.img,
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
    get updates() {
        return this._updates[this.currentIndex];
    }
    get sourceActor() {
        return this.sourceActors[this.currentIndex];
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