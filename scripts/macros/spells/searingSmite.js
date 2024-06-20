import {effectUtils, genericUtils, itemUtils, workflowUtils} from '../../utils.js';
async function use({workflow}) {
    let effectData = {
        name: workflow.item.name,
        icon: workflow.item.img,
        origin: workflow.item.uuid,
        duration: {
            seconds: 60
        },
        flags: {
            'chris-premades': {
                searingSmite: {
                    dc: itemUtils.getSaveDC(workflow.item),
                    level: workflow.castData.castLevel,
                    used: false
                }
            }
        }
    };
    effectUtils.addMacro(effectData, 'midi.actor', ['searingSmiteDamage']);
    await effectUtils.createEffect(workflow.actor, effectData, {concentrationItem: workflow.item, interdependent: true, identifier: 'searingSmite'});
    let concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    await genericUtils.update(concentrationEffect, {'duration.seconds': 60});
}
async function damage({workflow}) {
    if (!workflow.hitTargets.size) return;
    if (workflow.item.system.actionType !== 'mwak') return;
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'searingSmite');
    if (!effect) return;
    if (effect.flags['chris-premades'].searingSmite.used) return;
    await genericUtils.setFlag(effect, 'chris-premades', 'searingSmite.used', true);
    let damageType = 'fire';
    let formula = effect.flags['chris-premades'].searingSmite.level + 'd6';
    await workflowUtils.bonusDamage(workflow, formula, {damageType: damageType});
    let effectData = {
        name: genericUtils.translate('CHRISPREMADES.macros.searingSmite.fire'),
        icon: effect.icon,
        origin: effect.origin,
        duration: {
            seconds: effect.duration.remaining
        },
        changes: [
            {
                key: 'flags.midi-qol.OverTime',
                mode: 0,
                value: `turn=start, saveAbility=con, saveDC=${effect.flags['chris-premades'].searingSmite.dc}, saveMagic=true, damageRoll=1d6[fire], damageType=fire, name=${effect.name}`,
                priority: 20
            }
        ]
    };
    await effectUtils.createEffect(workflow.hitTargets.first().actor, effectData, {parentEntity: effect, interdependent: true, identifier: 'searingSmiteBranded'});
}
export let searingSmite = {
    name: 'Searing Smite',
    version: '0.12.0',
    midi: {
        item: [
            {
                pass: 'RollComplete',
                macro: use,
                priority: 50
            }
        ]
    }
};
export let searingSmiteDamage = {
    name: 'Searing Smite: Damage',
    version: searingSmite.version,
    midi: {
        actor: [
            {
                pass: 'postDamageRoll',
                macro: damage,
                priority: 250
            }
        ]
    }
};