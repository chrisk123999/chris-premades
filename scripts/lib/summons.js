// Crosshairs w/ preview texture being the token, text above with distance available via callbacks, error texture if outside of range
// changes, merge actor prototype token with token updates, create token document, update token delta with actor updates
// const tokenDocument = await actor.getTokenDocument(foundry.utils.mergeObject(placement, tokenUpdates));
// tokenDocument.delta.updateSource(actorUpdates);
// eventually await canvas.scene.createEmbeddedDocuments

import {Crosshairs} from './crosshairs.js';
import {genericUtils, animationUtils, effectUtils, actorUtils, itemUtils, combatUtils, compendiumUtils, constants} from '../utils.js';

export class Summons {
    constructor(sourceActors, updates, originItem, summonerToken, options) {
        this.sourceActors = sourceActors;
        this._updates = updates;
        this.originItem = originItem;
        this.summonerToken = summonerToken;
        this.options = options ?? {};
        this.spawnOptions = {}; // uh do something?
        this.spawnedTokens = [];
        this.currentIndex = 0;
    }
    static async spawn(sourceActors, updates = [{}], originItem, summonerToken, options = {duration: 3600, callbacks: undefined, range: 100, animation: 'default', onDeleteMacros: undefined, concentrationNonDependent: false}) {
        if (!Array.isArray(sourceActors)) sourceActors = [sourceActors];
        sourceActors = await Promise.all(sourceActors.map(async i => await actorUtils.getSidebarActor(i, {autoImport: true})));
        if (!Array.isArray(updates)) updates = [updates];
        let Summon = new Summons(sourceActors, updates, originItem, summonerToken, options);
        await Summon.prepareAllData();
        if (summonerToken.actor?.sheet?.rendered) summonerToken.actor.sheet.minimize();
        await Summon.spawnAll();
        if (summonerToken.actor?.sheet?.rendered) summonerToken.actor.sheet.maximize();
        await Summon.handleEffects();
        await Summon.handleInitiative();
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
    static async dismiss({trigger}) {
        let effect = trigger.entity;
        let summons = effect.flags['chris-premades']?.summons?.ids[effect.name];
        if (!summons) return;
        await canvas.scene.deleteEmbeddedDocuments('Token', summons);
    }
    static async getSummonItem(name, updates, originItem, {flatAttack = false, flatDC = false, damageBonus = null} = {}) {
        let bonuses = (new Roll(originItem.actor.system.bonuses.rsak.attack + ' + 0', originItem.actor.getRollData()).evaluateSync({strict: false})).total;
        let prof = originItem.actor.attributes.prof;
        let abilityModifier = originItem.actor.system.abilities[originItem.abilityMod ?? originItem.actor.system.attributes?.spellcasting].mod;
        let attackBonus = bonuses + prof + abilityModifier;
        let documentData = compendiumUtils.getItemFromCompendium(constants.featurePacks.summonFeatures, name, {
            object: true, 
            getDescription: true, 
            translate: name.replaceAll(' ', ''),
            flatAttack: flatAttack ? attackBonus : false,
            flatDC: flatDC ? itemUtils.getSaveDC(originItem) : false
        });
        if (damageBonus) documentData.system.damage.parts[0][0] += ' + ' + damageBonus;
        return genericUtils.mergeObject(documentData, updates);
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
        if (!this.options.callbacks?.show) {
            this.options.callbacks = {show: undefined};
            this.options.callbacks.show = async (crosshairs) => {
                let distance = 0;
                let ray;
                while (crosshairs.inFlight) {
                    await genericUtils.sleep(100);
                    ray = new Ray(this.summonerToken.center, crosshairs);
                    distance = canvas.grid.measureDistances([{ray}], {'gridSpaces': true})[0];
                    if (this.summonerToken.checkCollision(ray.B, {'origin': ray.A, 'type': 'move', 'mode': 'any'}) || distance > this.options.range) {
                        crosshairs.icon = 'icons/svg/hazard.svg';
                    } else {
                        crosshairs.icon = tokenDocument.texture.src;
                    }
                    crosshairs.draw();
                    crosshairs.label = distance + '/' + this.options.range + 'ft.';
                }
            };
        }
        if (this.options.animation != 'none' && !this.options.callbacks?.post) {
            let callbackFunction = animationUtils.summonEffects[this.options.animation];
            if (typeof callbackFunction === 'function' && animationUtils.jb2aCheck() === 'patreon' && animationUtils.aseCheck()) {
                genericUtils.setProperty(this.options.callbacks, 'post', callbackFunction);
                this.mergeUpdates({token: {alpha: 0}});
            }
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
        const templateData = await Crosshairs.showCrosshairs(crosshairsConfig, this.options.callbacks);
        if (templateData.cancelled) {
            console.log('was cancelled, do something different');
        }
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
                effects: [this.summonEffect]
            },
            token: {
                rotation: templateData.direction,
                x: templateData.x - (canvas.scene.grid.sizeX * tokenDocument.width / 2),
                y: templateData.y - (canvas.scene.grid.sizeY * tokenDocument.height / 2)
            }
        });
        this.handleSpecialUpdates();
        if (game.user.can('TOKEN_CREATE')) {
            let tokenDocument = await this.sourceActor.getTokenDocument(this.tokenUpdates);
            await tokenDocument.delta.updateSource(this.actorUpdates);
            let spawnedToken = await genericUtils.createEmbeddedDocuments(canvas.scene, 'Token', [tokenDocument]);
            this.spawnedTokens.push(spawnedToken[0]);
        } else {
            console.log('socket spawn');
            // this.socketSpawn();
        }
        this.options?.callbacks?.post({x: this.updates.token.x, y: this.updates.token.y}, this.spawnedTokens[this.spawnedTokens.length - 1], this.updates, this.currentIndex);
        return this.spawnedTokens;
    }
    handleSpecialUpdates() {
        if (itemUtils.getItemByIdentifer(this.originItem.actor, 'undeadThralls') && this.originItem.system.school === 'nec') {
            let wizardLevels = this.originItem.actor.classes.wizard?.system?.levels;
            if (wizardLevels) this.mergeUpdates({
                actor: {
                    system: {
                        attributes: {
                            hp: {
                                formula: this.hpFormula + ' + ' + wizardLevels
                            }
                        },
                        bonuses: {
                            mwak: {
                                damage: this.originItem.actor.system.attributes.prof
                            },
                            rwak: {
                                damage: this.originItem.actor.system.attributes.prof
                            }
                        }
                    }
                }
            });
        }
        if (itemUtils.getItemByIdentifer(this.originItem.actor, 'mightySummoner') && ['beast', 'fey'].includes(this.updates.actor?.system?.type?.value ?? actorUtils.typeOrRace(this.sourceActor))) {
            let formula = this.hpFormula;
            let hitDieAmount = parseInt(formula.match(/(\d+)d/)[1]);
            let extraHitPoints;
            if (hitDieAmount) extraHitPoints = hitDieAmount * 2;
            let updates = {};
            if (extraHitPoints) genericUtils.setProperty(updates, 'actor.system.attributes.hp.formula', formula + ' + ' + extraHitPoints);
            let items = new Set();
            this.sourceActor?.items?.filter(i => i.type === 'weapon')?.forEach(i => items.add(i.toObject()));
            Object?.values(this.updates.actor?.items)?.filter(i => i.type === 'weapon')?.forEach(i => items.add(i));
            if (items.size > 0) items.forEach(i => {
                i.system.properties.push('mgc');
                genericUtils.setProperty(updates, 'actor.items[' + i.name + ']', i);
            });
            if (updates != {}) this.mergeUpdates(updates);
        }
        if (itemUtils.getItemByIdentifer(this.originItem.actor, 'durableSummons') && (this.originItem.system.school === 'div')) {
            let currentTempHp = this.updates.actor?.system?.attributes?.hp?.temp;
            this.mergeUpdates({actor: {system: {attributes: {hp: {temp: currentTempHp ? Number(currentTempHp) + 30 : 30}}}}});
        }
    }
    async handleEffects() {
        // Account for items that can spawn things multiple times
        let effect = await effectUtils.getEffectByIdentifier(this.originItem.actor, itemUtils.getIdentifer(this.originItem) ?? this.originItem.name);
        if (effect) await genericUtils.update(effect, {
            flags: {
                'chris-premades': {
                    summons: {
                        ids: {
                            [this.originItem.name]: effect.flags['chris-premades'].summons.ids[this.originItem.name].concat(this.spawnedTokensIds)
                        }
                    }
                }
            }
        });
        // Options to be added to the created effect
        let effectOptions = {
            identifier: itemUtils.getIdentifer(this.originItem) ?? this.originItem.name
        };
        // Account for concentration special cases
        let concentrationEffect = effectUtils.getConcentrationEffect(this.originItem.actor, this.originItem);
        if (this.originItem.requiresConcentration && !this.options?.concentrationNonDependent && concentrationEffect) genericUtils.setProperty(effectOptions, 'concentrationItem', concentrationEffect);
        if (!effect) effect = await effectUtils.createEffect(this.originItem.actor, this.casterEffect, effectOptions);
        // Make summon effects dependent on caster effect
        let summonEffects = this.spawnedTokens.map(i => actorUtils.getEffects(i.actor).find(e => e.name === genericUtils.translate('CHRISPREMADES.Summons.SummonedCreature')));
        await effectUtils.addDependent(effect, summonEffects);
        // Make caster effect dependent on each summon effect
        await Promise.all(summonEffects.map(async e => await effectUtils.addDependent(e, [effect])));
        // Add on delete macros to be called, for cases where concentration does not delete the summon
        if (this.options?.onDeleteMacros && concentrationEffect) {
            let concentrationUpdates = {
                flags: {
                    'chris-premades': {
                        macros: {
                            effect: this.options.onDeleteMacros
                        }
                    }
                }
            };
            await genericUtils.update(concentrationEffect, concentrationUpdates);
        }
    }
    async handleInitiative() {
        if (!combatUtils.inCombat()) return;
        let casterCombatant = game.combat.combatants.contents.find(combatant => combatant.actorId === this.originItem.actor.id);
        if (!casterCombatant) return;
        let initiativeType = this.options?.initiativeType ?? 'seperate';
        switch (initiativeType) {
            case ('seperate'): {
                await Promise.all(this.spawnedTokens.forEach(async tok => {
                    await genericUtils.createEmbeddedDocuments(game.combat, 'Combatant', {
                        tokenId: tok.id,
                        sceneId: canvas.scene.id,
                        actorId: tok.actor.id,
                        initiative: null
                    });
                    await tok.actor.rollInitiative();
                }));
                break;
            }
            case ('follows'): {
                let updates = this.spawnedTokens.map(tok => ({
                    tokenId: tok.id,
                    sceneId: canvas.scene.id,
                    actorId: tok.actor.id,
                    initiative: casterCombatant.initiative - 0.01
                }));
                await genericUtils.createEmbeddedDocuments(game.combat, 'Combatant', updates);
                break;
            }
            case ('group'): {
                let initiativeRoll = await this.spawnedTokens[0].actor.getInitiativeRoll().evaluate();
                let messageData = {
                    flavor: this.originItem.name + ': Group Initiative'
                };
                await initiativeRoll.toMessage(messageData);
                let updates = this.spawnedTokens.map(tok => ({
                    tokenId: tok.id,
                    sceneId: canvas.scene.id,
                    actorId: tok.actor.id,
                    initiative: initiativeRoll.total
                }));
                await genericUtils.createEmbeddedDocuments(game.combat, 'Combatant', updates);
                break;
            }
        }
    }
    mergeUpdates(updates) {
        genericUtils.mergeObject(this.updates, updates);
    }
    get tokenUpdates() {
        return this.updates.token;
    }
    get actorUpdates() {
        return this.updates.actor;
    }
    get summonEffect() {
        return {
            name: genericUtils.translate('CHRISPREMADES.Summons.SummonedCreature'),
            img: this.originItem.img,
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
                    macros: {
                        effect: ['summonUtils']
                    },
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
    get hpFormula() {
        return this.updates.actor?.system?.attributes?.hp?.formula ?? this.sourceActor.system.attributes.hp.formula;
    }
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