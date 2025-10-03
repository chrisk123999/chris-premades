import {genericUtils, animationUtils, effectUtils, actorUtils, itemUtils, combatUtils, compendiumUtils, constants, dialogUtils, activityUtils} from '../utils.js';
import {crosshairUtils} from './utilities/crosshairUtils.js';
import {socket, sockets} from './sockets.js';
export class Summons {
    constructor(sourceActors, updates, originItem, summonerToken, options) {
        this.sourceActors = sourceActors;
        this._updates = updates;
        this.originItem = originItem;
        this.summonerToken = summonerToken;
        this.options = options ?? {};
        this.spawnedTokens = [];
        this.currentIndex = 0;
        this.matchElevation = game.settings.get('chris-premades', 'matchSummonElevation');
    }
    static async spawn(sourceActors, updates = [{}], originItem, summonerToken, options = {duration: undefined, callbacks: undefined, range: 100, animation: 'default', onDeleteMacros: undefined, concentrationNonDependent: false, initiativeType: 'separate', additionalVaeButtons: [], additionalSummonVaeButtons: [], dontDismissOnDefeat: false, dismissActivity: undefined, unhideActivities: undefined, customIdentifier: undefined/*dontAnimateOnDismiss: false*/}) {
        if (!Array.isArray(sourceActors)) sourceActors = [sourceActors];
        if (sourceActors.length && sourceActors[0]?.documentName !== 'Actor') {
            // Maybe from selectDocumentsDialog, in which case, transform from {document: Actor5e, amount: Int}[] to Actor5e[]:
            if ('document' in sourceActors[0] && 'amount' in sourceActors[0]) {
                sourceActors = sourceActors.reduce((acc, i) => acc.concat(Array(i.amount).fill(i.document)), []);
            }
        }
        let trueSourceActors = [];
        for (let sourceActor of sourceActors) {
            trueSourceActors.push(await actorUtils.getSidebarActor(sourceActor, {autoImport: true}));
        }
        if (!Array.isArray(updates)) updates = new Array(sourceActors.length).fill(genericUtils.deepClone(updates));
        for (let [idx, currUpdates] of updates.entries()) {
            updates[idx] = genericUtils.mergeObject(currUpdates, {actor: {prototypeToken: {actorLink: false}}, token: {actorLink: false}}, {inplace: false});
        }
        let Summon = new Summons(trueSourceActors, updates, originItem, summonerToken, options);
        await Summon.prepareAllData();
        if (summonerToken.actor?.sheet?.rendered) summonerToken.actor.sheet.minimize();
        await Summon.spawnAll();
        if (summonerToken.actor?.sheet?.rendered) summonerToken.actor.sheet.maximize();
        if (!Summon.spawnedTokens.length) return;
        await Summon.handleEffects();
        await Summon.handleInitiative();
        return Summon.spawnedTokens;
    }
    static async socketSpawn(actorUuid, updates, sceneUuid) {
        let actor = await fromUuid(actorUuid);
        let actorUpdates = updates.actor;
        let tokenUpdates = updates.token;
        let tokenDocument = await actor.getTokenDocument(tokenUpdates);
        let scene = await fromUuid(sceneUuid);
        await tokenDocument.delta.updateSource(actorUpdates);
        let [token] = await genericUtils.createEmbeddedDocuments(scene, 'Token', [tokenDocument]);
        return token.uuid;
    }
    // Helper function to dismiss any summons on an effect, will have the effect name and an array of ids
    // Called when either a summoned creature is dismissed specifically or all summoned creatures are dismissed
    static async dismiss({trigger}) {
        let effect = trigger.entity;
        if (!effect) return; // shouldn't be possible but just in case
        // let animName = effect.flags['chris-premades'].dismissAnimation;
        // let playAnim = animName !== 'none' && animationUtils.jb2aCheck() === 'patreon' && animationUtils.aseCheck();
        // let animFunction = animationUtils.summonEffects[animName];
        // playAnim = playAnim && (typeof animFunction === 'function');
        let dismissingSingleSummon = genericUtils.getIdentifier(effect) === 'summonedEffect';
        let summonedEffect;
        if (dismissingSingleSummon) {
            summonedEffect = effect;
            effect = await fromUuid(effect.flags['chris-premades'].parentEntityUuid);
            // Parent effect already deleted, don't need to do anything
            if (!effect) {
                // UNLESS it's a hostile one
                if (summonedEffect.parent.token.flags?.['chris-premades']?.summons?.turnedHostile) {
                    // if (playAnim) {
                    //     animFunction(undefined, summonedEffect.parent.token);
                    // }
                    await genericUtils.remove(summonedEffect.parent.token);
                }
                return;
            } 
        }
        let summons = effect.flags['chris-premades']?.summons?.ids[effect.name];
        let scenes = effect.flags['chris-premades']?.summons?.scenes[effect.name];
        if (!summons || !scenes) return;
        if (dismissingSingleSummon && summons.length === 1) {
            // if (playAnim) {
            //     animFunction(undefined, summonedEffect.parent.token);
            // }
            // If last summon, kill the effect
            await genericUtils.remove(effect);
            return;
        } else if (dismissingSingleSummon) {
            let idxToRemove = summons.findIndex(i => i === summonedEffect.parent.token.id);
            // if (playAnim) {
            //     animFunction(undefined, summonedEffect.parent.token);
            // }
            await genericUtils.remove(summonedEffect.parent.token);
            summons.splice(idxToRemove, 1);
            scenes.splice(idxToRemove, 1);
            await genericUtils.update(effect, {
                flags: {
                    'chris-premades': {
                        summons: {
                            ids: {
                                [effect.name]: summons
                            },
                            scenes: {
                                [effect.name]: scenes
                            }
                        }
                    }
                }
            });
            return;
        }
        scenes = scenes.map(i => game.scenes.get(i));
        let sceneAndIdsTuple = [];
        for (let i = 0; i < summons.length; i++) {
            let existingIdx = sceneAndIdsTuple.findIndex(j => j[0] === scenes[i]);
            if (existingIdx >= 0) {
                sceneAndIdsTuple[existingIdx][1].push(summons[i]);
            } else {
                sceneAndIdsTuple.push([scenes[i], [summons[i]]]);
            }
        }
        if (combatUtils.inCombat()) {
            let validIds = summons.map(i => game.combat.combatants.find(j => j.tokenId === i)?.id).filter(k => k);
            if (validIds.length) await genericUtils.deleteEmbeddedDocuments(game.combat, 'Combatant', validIds);
        }
        for (let [scene, sceneSummons] of sceneAndIdsTuple) {
            await genericUtils.deleteEmbeddedDocuments(scene, 'Token', sceneSummons.filter(i => scene.tokens.has(i)));
        }
    }
    static async dismissIfDead({trigger, ditem}) {
        if (ditem.newHP > 0) return;
        let shouldDismiss = await dialogUtils.confirm(trigger.entity.parent.name, 'CHRISPREMADES.Summons.DismissHP');
        if (!shouldDismiss) return;
        await Summons.dismiss({trigger});
        return true;
    }
    static async getSummonItem(name, updates, originItem, {flatAttack = false, flatDC = false, damageBonus = null, translate, identifier, damageFlat = null, rules = 'legacy', compendium = null} = {}) {
        let bonuses = (new Roll(originItem.actor.system.bonuses.rsak.attack + ' + 0', originItem.actor.getRollData()).evaluateSync({strict: false})).total;
        let prof = originItem.actor.system.attributes.prof;
        let abilityModifier = originItem.actor.system.abilities[originItem.abilityMod ?? originItem.actor.system.attributes?.spellcasting].mod;
        let attackBonus = bonuses + prof + abilityModifier;
        if (!compendium) compendium = rules === 'modern' ? constants.modernPacks.summonFeatures : constants.featurePacks.summonFeatures;
        let documentData = await compendiumUtils.getItemFromCompendium(compendium, name, {
            object: true, 
            getDescription: true, 
            translate,
            identifier,
            flatAttack: flatAttack ? attackBonus : false,
            flatDC: flatDC ? itemUtils.getSaveDC(originItem) : false
        });
        let damagingActivityIds = Object.entries(documentData.system.activities).filter(i => i[1].damage).map(i => i[0]);
        if (damageBonus) {
            for (let activityId of damagingActivityIds) {
                let damagePart = documentData.system.activities[activityId].damage.parts[0];
                if (damagePart.custom.enabled) {
                    damagePart.custom.formula += ' + ' + damageBonus;
                } else {
                    documentData.system.activities[activityId].damage.parts[0].bonus += ' + ' + damageBonus;
                }
            }
        }
        if (damageFlat) {
            for (let activityId of damagingActivityIds) {
                documentData.system.activities[activityId].damage.parts[0].custom = {
                    enabled: true,
                    formula: damageFlat.toString()
                };
            }
        }
        return genericUtils.mergeObject(documentData, updates, {inplace: false});
    }
    async prepareAllData() {
        while (this.currentIndex != this.sourceActors.length) {
            await this.prepareData();
            this.currentIndex++;
        }
        this.currentIndex = 0;
    }
    async prepareData() {
        if (this.options.animation != 'none') {
            let callbackFunction = animationUtils.summonEffects[this.options.animation];
            // TODO: Do we need this check here? Should be taking care of it per summoning spell/item
            if (typeof callbackFunction === 'function' && animationUtils.jb2aCheck() === 'patreon' && animationUtils.aseCheck()) {
                if (!this.options.callbacks?.post) genericUtils.setProperty(this.options, 'callbacks.post', callbackFunction);
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
        let tokenDocument = await this.sourceActor.getTokenDocument(this.tokenUpdates);
        //let actorData = {
        //    ownership: this.originItem.actor.ownership
        //};
        let currentUpdates = this.updates;
        //this.mergeUpdates({token: genericUtils.mergeObject(currentUpdates.token ?? {}, {actorData}, {overwrite: false})});
        genericUtils.setProperty(this.updates, 'actor.ownership', this.originItem.actor.ownership);
        let tokenImg = tokenDocument.texture.src;
        let rotation = this.tokenUpdates?.rotation ?? tokenDocument.rotation ?? 0;
        let crosshairsConfig = genericUtils.mergeObject(this.options?.crosshairs ?? {}, {
            size: canvas.grid.distance * tokenDocument.width / 2,
            icon: tokenImg,
            name: tokenDocument.name,
            direction: 0,
            resolution: ((this.tokenUpdates?.width ?? tokenDocument.width) % 2) ? 1 : -1
        }, {inplace: true, overwrite: false});
        crosshairsConfig.direction += rotation;
        const templateData = await crosshairUtils.aimCrosshair({
            token: this.summonerToken, 
            maxRange: this.options.range,
            crosshairsConfig,
            drawBoundries: false,
            customCallbacks: this.options.callbacks
        });
        if (templateData.cancelled) {
            console.log('was cancelled, do something different'); // this still needs to be done
            return;
        }
        let existingEffects = currentUpdates?.actor?.effects?.filter(i => genericUtils.getIdentifier(i) !== 'summonedEffect') ?? [];
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
                effects: existingEffects.concat([this.summonEffect])
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
            let spawnedToken = await genericUtils.createEmbeddedDocuments(this.summonerToken.scene, 'Token', [tokenDocument]);
            this.spawnedTokens.push(spawnedToken[0]);
        } else {
            let spawnedTokenUuid = await socket.executeAsGM(sockets.spawnSummon.name, this.sourceActor.uuid, this.updates, this.summonerToken.scene.uuid);
            let spawnedToken = await fromUuid(spawnedTokenUuid);
            this.spawnedTokens.push(spawnedToken);
        }
        this.options?.callbacks?.post({x: this.updates.token.x, y: this.updates.token.y}, this.spawnedTokens[this.spawnedTokens.length - 1], this.updates, this.currentIndex);
        return this.spawnedTokens;
    }
    handleSpecialUpdates() {
        if (itemUtils.getItemByIdentifier(this.originItem.actor, 'undeadThralls') && this.originItem.system.school === 'nec') {
            let wizardLevels = this.originItem.actor.classes.wizard?.system?.levels;
            if (wizardLevels) this.mergeUpdates({
                actor: {
                    system: {
                        attributes: {
                            hp: {
                                value: this.hpValue + wizardLevels,
                                formula: this.hpFormula + ' + ' + wizardLevels,
                                max: this.hpMax + wizardLevels
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
        if (itemUtils.getItemByIdentifier(this.originItem.actor, 'mightySummoner') && ['beast', 'fey'].includes(this.updates.actor?.system?.type?.value ?? actorUtils.typeOrRace(this.sourceActor))) {
            let hitDieAmount = parseInt(this.hpFormula.match(/(\d+)d/)?.[1]) ?? 0;
            let extraHitPoints;
            if (hitDieAmount) extraHitPoints = hitDieAmount * 2;
            let updates = {};
            if (extraHitPoints) {
                this.mergeUpdates({
                    actor: {
                        system: {
                            attributes: {
                                hp: {
                                    value: this.hpValue + extraHitPoints,
                                    formula: this.hpFormula + ' + ' + extraHitPoints,
                                    max: this.hpMax + extraHitPoints
                                }
                            }
                        }
                    }
                });
            }
            let items = new Set();
            this.sourceActor?.items?.filter(i => i.type === 'weapon')?.forEach(i => items.add(i.toObject()));
            this.updates.actor?.items?.filter(i => i.type === 'weapon')?.forEach(i => items.add(i));
            if (items.size > 0) items.forEach(i => {
                i.system.properties.push('mgc');
                genericUtils.setProperty(updates, 'actor.items[' + i.name + ']', i);
            });
            if (updates != {}) this.mergeUpdates(updates);
        }
        if (itemUtils.getItemByIdentifier(this.originItem.actor, 'durableSummons') && (this.originItem.system.school === 'div')) {
            let currentTempHp = this.updates.actor?.system?.attributes?.hp?.temp;
            this.mergeUpdates({actor: {system: {attributes: {hp: {temp: currentTempHp ? Number(currentTempHp) + 30 : 30}}}}});
        }
    }
    async handleEffects() {
        // Account for items that can spawn things multiple times
        let effect = await effectUtils.getEffectByIdentifier(this.originItem.actor, this.options?.customIdentifier ?? genericUtils.getIdentifier(this.originItem) ?? this.originItem.name);
        if (effect) await genericUtils.update(effect, {
            flags: {
                'chris-premades': {
                    summons: {
                        ids: {
                            [this.originItem.name]: (effect.flags['chris-premades'].summons?.ids[this.originItem.name] ?? []).concat(this.spawnedTokensIds)
                        },
                        scenes: {
                            [this.originItem.name]: (effect.flags['chris-premades'].summons?.scenes[this.originItem.name] ?? []).concat(this.spawnedTokensScenes)
                        }
                    }
                }
            }
        });
        // Options to be added to the created effect
        let effectOptions = {
            identifier: this.options?.customIdentifier ?? genericUtils.getIdentifier(this.originItem) ?? this.originItem.name,
            rules: genericUtils.getRules(this.originItem)
        };
        // For unhiding activities
        if (this.options?.unhideActivities) effectOptions.unhideActivities = this.options.unhideActivities;
        // Account for concentration special cases
        let concentrationEffect = effectUtils.getConcentrationEffect(this.originItem.actor, this.originItem);
        if (this.originItem.requiresConcentration && !this.options?.concentrationNonDependent && concentrationEffect) {
            genericUtils.setProperty(effectOptions, 'concentrationItem', this.originItem);
            genericUtils.setProperty(effectOptions, 'interdependent', true);
        }
        if (!effect) effect = await effectUtils.createEffect(this.originItem.actor, this.casterEffect, effectOptions);
        // Make summon effects dependent on caster effect
        let summonEffects = this.spawnedTokens.map(i => actorUtils.getEffects(i.actor).find(e => e.name === genericUtils.translate('CHRISPREMADES.Summons.SummonedCreature')));
        // I think doesn't need to be dependent since when parent effect is deleted we destroy all the summoned tokens anyway
        // await effectUtils.addDependent(effect, summonEffects);
        
        // Make caster effect dependent on each summon effect
        // await Promise.all(summonEffects.map(async e => await effectUtils.addDependent(e, [effect])));

        // Make summon effects "interdependent" on parent effect
        await Promise.all(summonEffects.map(async e => await genericUtils.update(e, {flags: {'chris-premades': {parentEntityUuid: effect.uuid}}})));

        // Add on delete macros to be called, for cases where concentration does not delete the summon
        if (this.options?.onDeleteMacros && concentrationEffect) {
            let concentrationUpdates = {
                flags: {
                    'chris-premades': {
                        macros: {
                            effect: this.options.onDeleteMacros
                        },
                        summons: {
                            parentEffect: effect.uuid
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
                await Promise.all(this.spawnedTokens.map(async tok => {
                    let initiativeRoll = await tok.actor.getInitiativeRoll().evaluate();
                    await initiativeRoll.toMessage({
                        speaker: ChatMessage.implementation.getSpeaker({token: tok})
                    });
                    await genericUtils.createEmbeddedDocuments(game.combat, 'Combatant', [{
                        tokenId: tok.id,
                        sceneId: canvas.scene.id,
                        actorId: tok.actor.id,
                        initiative: initiativeRoll.total
                    }]);
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
        if (this.matchElevation) return {elevation: (this.summonerToken?.document?.elevation ?? 0), ...this.updates.token};
        return this.updates.token;
    }
    get actorUpdates() {
        return this.updates.actor;
    }
    get summonEffect() {
        let buttons = [];
        if (!this.options.dismissActivity) {
            buttons.push({type: 'dismiss', name: genericUtils.translate('CHRISPREMADES.Summons.DismissSummon')});
        }
        let concentrationEffect = effectUtils.getConcentrationEffect(this.originItem.actor, this.originItem);
        let effectData = {
            name: genericUtils.translate('CHRISPREMADES.Summons.SummonedCreature'),
            img: this.originItem.img,
            origin: concentrationEffect?.uuid ?? this.originItem.uuid,
            flags: {
                'chris-premades': {
                    info: {
                        identifier: 'summonedEffect'
                    },
                    vae: {
                        buttons: buttons.concat((this.options.additionalSummonVaeButtons ?? []))
                    },
                    macros: {effect: ['summonUtils'], ...(this.options.dontDismissOnDefeat ? {} : {midi: {actor: ['summonUtils']}})},
                    rules: genericUtils.getRules(this.originItem)
                    // dismissAnimation: this.options.dontAnimateOnDismiss ? 'none' : this.options.animation
                }
            }
        };
        if (this.options.duration) {
            effectData.duration = {seconds: this.options.duration};
        } else {
            effectData.flags.dae = {showIcon: true};
        }
        return effectData;
    }
    get casterEffect() {
        let dismissButton;
        if (this.options.dismissActivity) {
            dismissButton = {
                type: 'use',
                name: this.options.dismissActivity.name,
                identifier: genericUtils.getIdentifier(this.options.dismissActivity.item),
                activityIdentifier: activityUtils.getIdentifier(this.options.dismissActivity)
            };
        } else {
            dismissButton = {
                type: 'dismiss',
                name: genericUtils.translate('CHRISPREMADES.Summons.DismissSummon')
            };
        }
        let concentrationEffect = effectUtils.getConcentrationEffect(this.originItem.actor, this.originItem);
        let effectData = {
            name: this.originItem.name,
            img: this.originItem.img,
            origin: concentrationEffect?.uuid ?? this.originItem.uuid,
            flags: {
                'chris-premades': {
                    macros: {
                        effect: ['summonUtils']
                    },
                    vae: {
                        buttons: [dismissButton, ...(this.options.additionalVaeButtons ?? [])]
                    },
                    summons: {
                        ids: {
                            [this.originItem.name]: this.spawnedTokensIds 
                        },
                        scenes: {
                            [this.originItem.name]: this.spawnedTokensScenes
                        }
                    },
                    // dismissAnimation: this.options.dontAnimateOnDismiss ? 'none' : this.options.animation
                }
            }
        };
        if (this.options.duration) {
            effectData.duration = {seconds: this.options.duration};
        } else {
            effectData.flags.dae = {showIcon: true};
        }
        return effectData;
    }
    get spawnedTokensIds() {
        return this.spawnedTokens.map(i => i.id);
    }
    get spawnedTokensScenes() {
        return this.spawnedTokens.map(i => i.object.scene.id);
    }
    get updates() {
        return this._updates[this.currentIndex] ?? this._updates[0];
    }
    get sourceActor() {
        return this.sourceActors[this.currentIndex];
    }
    get hpValue() {
        return this.updates.actor?.system?.attributes?.hp?.value ?? this.sourceActor.system.attributes.hp.value;
    }
    get hpFormula() {
        return String(this.updates.actor?.system?.attributes?.hp?.formula ?? this.sourceActor.system.attributes.hp.formula);
    }
    get hpMax() {
        return this.updates.actor?.system?.attributes?.hp?.max ?? this.sourceActor.system.attributes.hp.max;
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
    midi: {
        actor: [
            {
                pass: 'targetApplyDamage',
                macro: Summons.dismissIfDead,
                priority: 50
            }
        ]
    }
};
export let summonUtilsModern = {
    ...summonUtils,
    rules: 'modern'
};