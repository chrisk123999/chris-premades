import {constants, effectUtils, genericUtils, workflowUtils} from '../../utils.js';
async function use({workflow}) {
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: {
            seconds: 60 * workflow.item.system.duration.value
        },
        flags: {
            'chris-premades': {
                brandingSmite: {
                    level: workflow.castData.castLevel,
                    used: false
                }
            }
        }
    };
    effectUtils.addMacro(effectData, 'midi.actor', ['brandingSmiteDamage']);
    await effectUtils.createEffect(workflow.actor, effectData, {concentrationItem: workflow.item, strictlyInterdependent: true, identifier: 'brandingSmite'});
    let concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    if (concentrationEffect) await genericUtils.update(concentrationEffect, {'duration.seconds': effectData.duration.seconds});
}
async function damage({workflow}) {
    if (!workflow.hitTargets.size) return;
    if (!constants.weaponAttacks.includes(workflow.item.system.actionType)) return;
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'brandingSmite');
    if (!effect) return;
    if (effect.flags['chris-premades'].brandingSmite.used) return;
    await genericUtils.setFlag(effect, 'chris-premades', 'brandingSmite.used', true);
    let damageType = 'radiant';
    let formula = effect.flags['chris-premades'].brandingSmite.level + 'd6';
    await workflowUtils.bonusDamage(workflow, formula, {damageType: damageType});
    let effectData = {
        name: genericUtils.translate('CHRISPREMADES.Macros.BrandingSmite.Branded'),
        img: effect.img,
        origin: effect.origin,
        duration: {
            seconds: effect.duration.remaining
        },
        changes: [
            {
                key: 'ATL.light.dim',
                mode: 4,
                value: 5,
                priority: 20
            }, 
            {
                key: 'system.traits.ci.value',
                mode: 0,
                value: 'invisible',
                priority: 20
            }
        ]
    };
    await effectUtils.createEffect(workflow.hitTargets.first().actor, effectData, {parentEntity: effect, strictlyInterdependent: true});
}
export let brandingSmite = {
    name: 'Branding Smite',
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