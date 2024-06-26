import {actorUtils, effectUtils, genericUtils} from '../../utils.js';

async function damage({workflow}) {
    if (!workflow.targets.size) return;
    let newDamageRoll = '';
    let creatureTypes = Array.from(workflow.targets).map(target => actorUtils.typeOrRace(target.actor));
    if (creatureTypes.some(type => type === 'plant')) {
        if (!creatureTypes.every(type => type === 'plant')) return;
        for (let term of workflow.damageRoll.terms) {
            if (term.isDeterministic) {
                newDamageRoll += term.formula;
            } else {
                newDamageRoll += term.number + 'd' + term.faces + 'min' + term.faces + '[' + workflow.defaultDamageType + ']';
            }
        }
    } else if (creatureTypes.some(type => ['undead', 'construct'].includes(type))) {
        if (!creatureTypes.every(type => ['undead', 'construct'].includes(type))) return;
        newDamageRoll = '0[' + workflow.defaultDamageType + ']';
    }
    let damageRoll = await new CONFIG.Dice.DamageRoll(newDamageRoll, workflow.actor.getRollData()).evaluate();
    await workflow.setDamageRoll(damageRoll);
}

async function damageApplication({trigger, workflow}) {
    if (!workflow.targets.size) return;
    let creatureTypes = Array.from(workflow.targets).map(target => actorUtils.typeOrRace(target.actor));
    if (creatureTypes.every(type => type === 'plant')) return;
    let ditem = workflow.damageItem;
    let targetActor = await fromUuid(ditem.actorUuid);
    let creatureType = actorUtils.typeOrRace(targetActor);
    if (creatureType === 'plant') {
        let maxDamage = 0;
        for (let term of workflow.damageRoll.terms) {
            if (term.isDeterministic) {
                maxDamage += term.total;
            } else {
                maxDamage += term.number * term.faces;
            }
        }
        let trueMaxDamage = maxDamage;
        let hasDI = actorUtils.checkTrait(targetActor, 'di', workflow.defaultDamageType);
        if (hasDI) {
            await genericUtils.remove(trigger.entity);
            return;
        }
        let hasDR = actorUtils.checkTrait(targetActor, 'dr', workflow.defaultDamageType);
        if (hasDR) maxDamage = Math.floor(maxDamage / 2);
        let hasDV = actorUtils.checkTrait(targetActor, 'dv', workflow.defaultDamageType);
        if (hasDV) maxDamage *= 2;
        let saved = !workflow.failedSaves.map(token => token.actor).has(targetActor);
        if (saved) maxDamage = Math.floor(maxDamage / 2);
        let remainingDamage = maxDamage - Math.min(ditem.oldTempHP, maxDamage);
        ditem.newTempHP = ditem.oldTempHP - (maxDamage - remainingDamage);
        ditem.tempDamage = (maxDamage - remainingDamage);
        ditem.totalDamage = trueMaxDamage;
        ditem.appliedDamage = maxDamage;
        ditem.hpDamage = remainingDamage;
        ditem.newHP = Math.max(0, ditem.oldHP - remainingDamage);
    } else {
        await genericUtils.remove(trigger.entity);
    }
}

async function early({workflow}) {
    if (!workflow.targets.size) return;
    let creatureTypes = Array.from(workflow.targets).map(target => actorUtils.typeOrRace(target.actor));
    if (!creatureTypes.some(type => ['plant', 'undead', 'construct'].includes(type))) return;
    if (creatureTypes.every(type => ['undead', 'construct'].includes(type))) return;
    for (let target of workflow.targets) {
        let creatureType = actorUtils.typeOrRace(target.actor);
        let effectData;
        if (creatureType === 'plant') {
            effectData = {
                name: genericUtils.translate('CHRISPREMADES.genericEffects.conditionDisadvantage'),
                icon: 'icons/magic/time/arrows-circling-green.webp',
                origin: workflow.item.uuid,
                duration: {
                    turns: 1
                },
                changes: [
                    {
                        key: 'flags.midi-qol.disadvantage.ability.save.all',
                        value: 1,
                        mode: 5,
                        priority: 120
                    }
                ],
                flags: {
                    dae: {
                        specialDuration: [
                            'isDamaged'
                        ]
                    },
                    'chris-premades': {
                        effect: {
                            noAnimation: true
                        }
                    }
                }
            };
        } else if (['undead', 'construct'].includes(creatureType)) {
            effectData = {
                name: genericUtils.translate('CHRISPREMADES.genericEffects.conditionImmunity'),
                icon: 'icons/magic/time/arrows-circling-green.webp',
                origin: workflow.item.uuid,
                duration: {
                    turns: 1
                },
                changes: [
                    {
                        key: 'system.traits.di.value',
                        value: workflow.defaultDamageType,
                        mode: 5,
                        priority: 120
                    }
                ],
                flags: {
                    dae: {
                        specialDuration: [
                            'isDamaged'
                        ]
                    },
                    'chris-premades': {
                        effect: {
                            noAnimation: true
                        }
                    }
                }
            };
        } else {
            continue;
        }
        effectUtils.addMacro(effectData, 'midi.actor', ['blightDamage']);
        await effectUtils.createEffect(target.actor, effectData);
    }
}

export let blight = {
    name: 'Blight',
    version: '0.12.0',
    midi: {
        item: [
            {
                pass: 'postDamageRoll',
                macro: damage,
                priority: 250
            }, {
                pass: 'postPreambleComplete',
                macro: early,
                priority: 50
            }
        ]
    }
};
export let blightDamage = {
    name: 'Blight: Damage',
    version: blight.version,
    midi: {
        actor: [
            {
                pass: 'applyDamage',
                macro: damageApplication,
                priority: 250
            }
        ]
    }
};