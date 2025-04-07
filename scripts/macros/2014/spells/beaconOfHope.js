import {actorUtils, effectUtils, genericUtils, itemUtils} from '../../../utils.js';
async function use({workflow}) {
    if (!workflow.targets.size) return;
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: itemUtils.convertDuration(workflow.item),
        changes: [
            {
                key: 'flags.midi-qol.advantage.ability.save.wis',
                mode: 5,
                value: 1,
                priority: 20
            },
            {
                key: 'flags.midi-qol.advantage.deathSave',
                mode: 5,
                value: 1,
                priority: 20
            }
        ]
    };
    effectUtils.addMacro(effectData, 'midi.actor', ['beaconOfHopeHopeful']);
    for (let token of workflow.targets) {
        await effectUtils.createEffect(token.actor, effectData, {concentrationItem: workflow.item, identifier: 'beaconOfHope'});
    }
    let concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    if (concentrationEffect) await genericUtils.update(concentrationEffect, {duration: effectData.duration});
}
async function damageApplication({workflow, ditem}) {
    if (!workflow.targets.size) return;
    if (!workflow.damageRoll) return;
    let healingType = CONFIG.DND5E.healingTypes['healing'].label.toLowerCase();
    let defaultDamageType = workflow.defaultDamageType;
    if (defaultDamageType !== healingType) return;
    let targetActor = await fromUuid(ditem.actorUuid);
    if (actorUtils.checkTrait(targetActor, 'di', healingType)) return;
    let newHealingTotal = 0;
    for (let term of workflow.damageRoll.terms) {
        if (term.flavor && term.flavor.length && term.flavor.toLowerCase() !== healingType) continue;
        if (term.isDeterministic) {
            if (isNaN(term.total)) continue;
            newHealingTotal += term.total;
        } else {
            newHealingTotal += term.number * term.faces;
        }
    }
    let appliedHealingTotal = newHealingTotal;
    if (actorUtils.checkTrait(targetActor, 'dr', healingType)) appliedHealingTotal = Math.floor(appliedHealingTotal / 2);
    if (actorUtils.checkTrait(targetActor, 'dv', healingType)) appliedHealingTotal = appliedHealingTotal * 2;
    let maxHP = targetActor.system.attributes.hp.max;
    ditem.totalDamage = newHealingTotal;
    ditem.hpDamage = -Math.min(appliedHealingTotal, maxHP - ditem.oldHP);
    ditem.damageDetail[0].value = ditem.hpDamage;
    ditem.newHP = ditem.oldHP - ditem.hpDamage;
}
export let beaconOfHope = {
    name: 'Beacon of Hope',
    version: '1.2.32',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    }
};
export let beaconOfHopeHopeful = {
    name: 'Beacon of Hope: Hopeful',
    version: beaconOfHope.version,
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