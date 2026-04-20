import {activityUtils, constants, dialogUtils, effectUtils, genericUtils, itemUtils, workflowUtils} from '../../../../../utils.js';
async function beginAura({workflow}) {
    let damageOptions = itemUtils.getConfig(workflow.item, 'damageTypes');
    let damageType = await dialogUtils.selectDamageType(damageOptions, workflow.item.name, 'CHRISPREMADES.Generic.SelectDamageType');
    if (!damageType) return;
    let formula = itemUtils.getConfig(workflow.item, 'formula');
    let effectData = {
        name: genericUtils.format('CHRISPREMADES.Auras.Source', {auraName: workflow.item.name}),
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: itemUtils.convertDuration(workflow.activity),
        flags: {
            'chris-premades': {
                damageType,
                formula
            },
            dae: {
                stackable: 'noneName'
            }
        }
    };
    effectUtils.addMacro(effectData, 'aura', ['runesOfWarAura']);
    await effectUtils.createEffect(workflow.actor, effectData, {identifier: 'runesOfWar', rules: 'modern'});
}
async function create({trigger: {entity: effect, target, identifier}}) {
    let targetEffect = effectUtils.getEffectByIdentifier(target.actor, identifier);
    if (targetEffect) return;
    let effectData = {
        name: effect.name.split(':')[0],
        img: effect.img,
        origin: effect.uuid,
        duration: {
            seconds: effect.duration.remaining
        },
        flags: {
            'chris-premades': {
                aura: true,
                damageType: effect.flags['chris-premades'].damageType, 
                effect: {
                    noAnimation: true
                },
                formula: effect.flags['chris-premades'].formula,
                rules: 'modern'
            }
        }
    };
    effectUtils.addMacro(effectData, 'midi.actor', 'runesOfWarDamage');
    return {
        effectData,
        effectOptions: {
            identifier
        }
    };
}
async function damageBonus({trigger: {entity: effect}, workflow}) {
    if (!workflowUtils.isAttackType(workflow, 'weaponAttack')) return;
    let {damageType, formula} = effect.flags['chris-premades'] ?? {};
    if (!damageType || !formula) return;
    await workflowUtils.bonusDamage(workflow, formula, {damageType});
}
export let runesOfWar = {
    name:'Runes of War',
    version: '1.5.21',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: beginAura,
                priority: 50
            }
        ]
    },
    config: [
        {
            value: 'damageTypes',
            label: 'CHRISPREMADES.Config.DamageTypes',
            type: 'select-many',
            default: ['acid', 'cold', 'fire', 'lightning', 'thunder'],
            options: constants.damageTypeOptions,
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'formula',
            label: 'CHRISPREMADES.Config.DamageBonus',
            type: 'text',
            default: '1d4',
            category: 'homebrew',
            homebrew: true
        }
    ]
};
export let runesOfWarAura = {
    name: 'Runes of War: Aura',
    version: runesOfWar.version,
    rules: runesOfWar.rules,
    aura: [
        {
            pass: 'create',
            macro: create,
            priority: 50,
            distance: 30,
            identifier: 'runesOfWarAura',
            disposition: 'ally'
        }
    ]
};
export let runesOfWarDamage = {
    name: runesOfWar.name,
    version: runesOfWar.version,
    rules: runesOfWar.rules,
    midi: {
        actor: [
            {
                pass: 'damageRollComplete',
                macro: damageBonus,
                priority: 200
            }
        ]
    }
};
