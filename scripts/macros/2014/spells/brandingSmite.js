import {constants, effectUtils, genericUtils, itemUtils, workflowUtils} from '../../../utils.js';
async function use({workflow}) {
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: itemUtils.convertDuration(workflow.item),
        flags: {
            'chris-premades': {
                brandingSmite: {
                    level: workflowUtils.getCastLevel(workflow),
                    used: false,
                    damageType: itemUtils.getConfig(workflow.item, 'damageType')
                }
            }
        }
    };
    effectUtils.addMacro(effectData, 'midi.actor', ['brandingSmiteDamage']);
    await effectUtils.createEffect(workflow.actor, effectData, {concentrationItem: workflow.item, strictlyInterdependent: true, identifier: 'brandingSmite'});
    let concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    if (concentrationEffect) await genericUtils.update(concentrationEffect, {duration: effectData.duration});
}
async function damage({workflow}) {
    if (!workflow.hitTargets.size) return;
    if (!constants.weaponAttacks.includes(workflow.activity.actionType)) return;
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'brandingSmite');
    if (!effect) return;
    if (effect.flags['chris-premades'].brandingSmite.used) return;
    await genericUtils.setFlag(effect, 'chris-premades', 'brandingSmite.used', true);
    let damageType = effect.flags['chris-premades'].brandingSmite.damageType;
    let formula = effect.flags['chris-premades'].brandingSmite.level + 'd6';
    await workflowUtils.bonusDamage(workflow, formula, {damageType: damageType});
    let effectData = {
        name: genericUtils.translate('CHRISPREMADES.Macros.BrandingSmite.Branded'),
        img: effect.img,
        origin: effect.uuid,
        duration: {
            seconds: effect.duration.remaining
        },
        changes: [
            {
                key: 'ATL.light.dim',
                mode: 4,
                value: genericUtils.handleMetric(5),
                priority: 20
            }, 
            {
                key: 'system.traits.ci.value',
                mode: 2,
                value: 'invisible',
                priority: 20
            }
        ]
    };
    await effectUtils.createEffect(workflow.hitTargets.first().actor, effectData, {parentEntity: effect, strictlyInterdependent: true});
}
export let brandingSmite = {
    name: 'Branding Smite',
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
            default: 'radiant',
            options: constants.damageTypeOptions,
            homebrew: true,
            category: 'homebrew'
        },
    ]
};
export let brandingSmiteDamage = {
    name: 'Branding Smite: Damage',
    version: brandingSmite.version,
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