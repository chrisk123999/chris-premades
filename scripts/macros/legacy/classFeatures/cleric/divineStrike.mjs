import {animationUtils, automationUtils, DamageBonus, workflowUtils} from '../../../../proxy.mjs';
async function damage({document: activity, workflow}) {
    if (!activity.item.system.uses.value) return;
    if (workflow.hitTargets.size !== 1 || workflow.isFumble || !workflowUtils.isAttackType(workflow, 'weaponAttack')) return;
    const config = automationUtils.getConfigValues(activity.item, ['formula', 'classIdentifier']);
    const subclass = workflow.actor.classes[config.classIdentifier]?.subclass?.identifier;
    let damageType = 'radiant';
    switch(subclass) {
        case 'death': damageType = 'necrotic'; break;
        case 'forge': damageType = 'fire'; break;
        case 'nature': damageType = ['cold', 'fire', 'lightning']; break;
        case 'order': damageType = 'psychic'; break;
        case 'tempest': damageType = 'thunder'; break;
        case 'trickery': damageType = 'poison'; break;
        case 'war': damageType = ''; break; // workflow default
        default: damageType = 'radiant'; break;
    }
    const animation = automationUtils.getResolvedAnimation(activity.item, 'animation', config.animation);
    const playAnimation = animation?.animation && animationUtils.sequencerCheck() && animationUtils.jb2aCheck() === 'patreon' && animationUtils.aseCheck();
    return new DamageBonus(activity, {formula: config.formula, type: damageType}).withDefaultCosts()
        .withOnUse(async ({workflow}) => {
            if (playAnimation) animation.animation.macros.play(workflow);
            await workflowUtils.syntheticActivityRoll(activity, []);
        })
        .initialize(workflow);
}
export const divineStrike = {
    name: 'Divine Strike',
    version: '2.0.3',
    rules: '2014',    
    roll: [
        {
            pass: 'actorOptionalBonusDamage',
            macro: damage,
            priority: 200
        }
    ],
    config: {
        animation: {
            default: {
                source: 'chris-premades',
                identifier: 'divineStrike'
            },
            type: 'selectAnimation',
            inputs: ['workflow'],
            label: 'CHRISPREMADES.Config.Animation',
            category: 'visuals'
        },
        formula: {
            default: '@scale.cleric.divine-strike',
            type: 'text',
            label: 'CHRISPREMADES.Config.DamageBonus',
            category: 'behavior'
        },
        classIdentifier: {
            default: 'cleric',
            type: 'text',
            label: 'CHRISPREMADES.Config.ClassIdentifier',
            category: 'homebrew'
        }
    },
    scales: [
        {
            identifier: 'divine-strike',
            classIdentifier: 'cleric',
            data: {
                type: 'ScaleValue',
                configuration: {
                    distance: {
                        units: ''
                    },
                    identifier: 'divine-strike',
                    type: 'dice',
                    scale: {
                        8: {number: 1, faces: 8},
                        14: {number: 2, faces: 8}
                    }
                },
                value: {},
                title: 'Divine Strike'
            }
        }
    ]
};
