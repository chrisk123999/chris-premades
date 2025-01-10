import {actorUtils, constants, effectUtils, genericUtils} from '../../utils.js';
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
                newDamageRoll += term.number + 'd' + term.faces + 'min' + term.faces;
            }
        }
    } else if (creatureTypes.some(type => ['undead', 'construct'].includes(type))) {
        if (!creatureTypes.every(type => ['undead', 'construct'].includes(type))) return;
        newDamageRoll = '0';
    }
    let damageRoll = await new CONFIG.Dice.DamageRoll(newDamageRoll, workflow.item.getRollData(), {type: workflow.defaultDamageType}).evaluate();
    await workflow.setDamageRoll(damageRoll);
}
async function damageApplication({trigger, workflow, ditem}) {
    if (!workflow.targets.size) return;
    let creatureTypes = Array.from(workflow.targets).map(target => actorUtils.typeOrRace(target.actor));
    if (creatureTypes.every(type => type === 'plant')) return;
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
        ditem.damageDetail[0].value = maxDamage;
        let remainingDamage = maxDamage - Math.min(ditem.oldTempHP, maxDamage);
        ditem.newTempHP = ditem.oldTempHP - (maxDamage - remainingDamage);
        ditem.tempDamage = (maxDamage - remainingDamage);
        ditem.totalDamage = trueMaxDamage;
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
                name: genericUtils.translate('CHRISPREMADES.GenericEffects.ConditionDisadvantage'),
                img: constants.tempConditionIcon,
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
                name: genericUtils.translate('CHRISPREMADES.GenericEffects.ConditionImmunity'),
                img: constants.tempConditionIcon,
                origin: workflow.item.uuid,
                duration: {
                    turns: 1
                },
                changes: [
                    {
                        key: 'system.traits.di.value',
                        value: workflow.defaultDamageType,
                        mode: 2,
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
    version: '1.1.10',
    midi: {
        item: [
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 250
            }, 
            {
                pass: 'preambleComplete',
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
                pass: 'targetApplyDamage',
                macro: damageApplication,
                priority: 250
            }
        ]
    }
};