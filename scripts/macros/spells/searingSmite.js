import {constants, effectUtils, genericUtils, itemUtils, workflowUtils} from '../../utils.js';
async function use({workflow}) {
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: itemUtils.convertDuration(workflow.item),
        flags: {
            'chris-premades': {
                searingSmite: {
                    dc: itemUtils.getSaveDC(workflow.item),
                    level: workflowUtils.getCastLevel(workflow),
                    used: false,
                    damageType: itemUtils.getConfig(workflow.item, 'damageType')
                }
            }
        }
    };
    effectUtils.addMacro(effectData, 'midi.actor', ['searingSmiteDamage']);
    await effectUtils.createEffect(workflow.actor, effectData, {concentrationItem: workflow.item, strictlyInterdependent: true, identifier: 'searingSmite'});
    let concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    if (concentrationEffect) await genericUtils.update(concentrationEffect, {duration: effectData.duration});
}
async function damage({trigger: {entity: effect}, workflow}) {
    if (!workflow.hitTargets.size) return;
    if (workflow.activity.actionType !== 'mwak') return;
    if (effect.flags['chris-premades'].searingSmite.used) return;
    await genericUtils.setFlag(effect, 'chris-premades', 'searingSmite.used', true);
    let damageType = effect.flags['chris-premades'].searingSmite.damageType;
    let formula = effect.flags['chris-premades'].searingSmite.level + 'd6';
    await workflowUtils.bonusDamage(workflow, formula, {damageType: damageType});
    let effectData = {
        name: genericUtils.translate('CHRISPREMADES.Macros.SearingSmite.Fire'),
        img: effect.img,
        origin: effect.uuid,
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
    await effectUtils.createEffect(workflow.hitTargets.first().actor, effectData, {parentEntity: effect, strictlyInterdependent: true});
}
export let searingSmite = {
    name: 'Searing Smite',
    version: '1.1.0',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    },
    config: [
        {
            value: 'damageType',
            label: 'CHRISPREMADES.Config.DamageType',
            type: 'select',
            default: 'fire',
            options: constants.damageTypeOptions,
            homebrew: true,
            category: 'homebrew'
        },
    ]
};
export let searingSmiteDamage = {
    name: 'Searing Smite: Damage',
    version: searingSmite.version,
    midi: {
        actor: [
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 250
            }
        ]
    }
};