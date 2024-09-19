import {actorUtils, compendiumUtils, constants, effectUtils, errors, genericUtils, workflowUtils} from '../../../utils.js';

async function damage({workflow}) {
    if (workflow.hitTargets.size !== 1) return;
    if (actorUtils.typeOrRace(workflow.hitTargets.first().actor) !== 'undead') return;
    let damageRoll = await new CONFIG.Dice.DamageRoll('1d10[healing]', {}, {type: 'healing'}).evaluate();
    await workflow.setDamageRolls([damageRoll]);
    let featureData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.itemFeatures, 'Blackrazor: Backlash', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.Blackrazor.Backlash'});
    if (!featureData) {
        errors.missingPackItem();
        return;
    }
    await workflowUtils.syntheticItemDataRoll(featureData, workflow.actor, [workflow.token]);
}
async function late({workflow}) {
    if (workflow.hitTargets.size !== 1) return;
    let ditem = workflow.damageList[0];
    if (ditem.newHP || !ditem.oldHP) return;
    let maxHP = workflow.hitTargets.first().actor.system.attributes.hp.max;
    let currTempHP = workflow.actor.system.attributes.hp.temp;
    if (currTempHP <= maxHP) await workflowUtils.applyDamage([workflow.token], maxHP, 'temphp');
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'blackrazor');
    if (effect) return;
    let effectData = {
        name: genericUtils.translate('CHRISPREMADES.Macros.Blackrazor.Devoured'),
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: {
            seconds: 86400
        },
        changes: [
            {
                key: 'flags.midi-qol.advantage.attack.all',
                mode: 0,
                value: 1,
                priority: 20
            },
            {
                key: 'flags.midi-qol.advantage.ability.save.all',
                mode: 0,
                value: 1,
                priority: 20
            },
            {
                key: 'flags.midi-qol.advantage.ability.check.all',
                mode: 0,
                value: 1,
                priority: 20
            }
        ]
    };
    effectUtils.addMacro(effectData, 'midi.actor', ['blackrazor']);
    await effectUtils.createEffect(workflow.actor, effectData, {identifier: 'blackrazor'});
}
async function onHit({trigger: {entity: effect}}) {
    if (effect.parent.system.attributes.hp.temp) return;
    await genericUtils.remove(effect);
}
export let blackrazor = {
    name: 'Blackrazor',
    version: '0.12.70',
    midi: {
        item: [
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 50
            },
            {
                pass: 'rollFinished',
                macro: late,
                priority: 50
            }
        ],
        actor: [
            {
                pass: 'onHit',
                macro: onHit,
                priority: 50
            }
        ]
    }
};