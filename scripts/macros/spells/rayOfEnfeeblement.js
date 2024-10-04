import {effectUtils, genericUtils, itemUtils} from '../../utils.js';

async function use({workflow}) {
    let concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    if (!workflow.hitTargets.size) {
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: {
            seconds: 60 * workflow.item.system.duration.value
        },
        changes: [
            {
                key: 'flags.midi-qol.OverTime',
                mode: 0,
                value: 'label=' + genericUtils.translate('CHRISPREMADES.Macros.RayOfEnfeeblement.Overtime') + ',turn=end,saveDC=' + itemUtils.getSaveDC(workflow.item) + ',saveAbility=con,savingThrow=true,saveMagic=true',
                priority: 20
            }
        ]
    };
    effectUtils.addMacro(effectData, 'midi.actor', ['rayOfEnfeeblementEnfeebled']);
    for (let target of workflow.hitTargets) {
        await effectUtils.createEffect(target.actor, effectData, {concentrationItem: workflow.item, interdependent: true, identifier: 'rayOfEnfeeblementEnfeebled'});
    }
    if (concentrationEffect) await genericUtils.update(concentrationEffect, {'duration.seconds': effectData.duration.seconds});
}
async function damage({workflow}) {
    if (workflow.isFumble || workflow.item.type !== 'weapon') return;
    if (workflow.item.system.properties.has('fin')) {
        let {str, dex} = workflow.actor.system.abilities;
        if (str.value < dex.value) return;
    }
    workflow.damageRolls = await Promise.all(workflow.damageRolls.map(async damageRoll => {
        return await new CONFIG.Dice.DamageRoll('floor((' + damageRoll.formula + ') / 2)', workflow.item.getRollData(), damageRoll.options);
    }));
    await workflow.setDamageRolls(workflow.damageRolls);
}
export let rayOfEnfeeblement = {
    name: 'Ray of Enfeeblement',
    version: '0.12.0',
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
export let rayOfEnfeeblementEnfeebled = {
    name: 'Ray of Enfeeblement: Enfeebled',
    version: rayOfEnfeeblement.version,
    midi: {
        actor: [
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 50
            }
        ]
    }
};