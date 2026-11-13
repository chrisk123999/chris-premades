import {animationUtils, automationUtils, DamageBonus, Logging, workflowUtils} from '../../../../proxy.mjs';
const DAMAGE_TYPE = {
    death: 'necrotic',
    forge: 'fire',
    nature: ['cold', 'fire', 'lightning'],
    order: 'psychic',
    tempest: 'thunder',
    trickery: 'poison',
    war: '' // workflow default
};
async function damage({document: activity, workflow}) {
    if (workflow.hitTargets.count !== 1 || workflow.isFumble || !workflowUtils.isAttackType(workflow, 'weaponAttack')) return;
    if (!activity.item.system.uses.value) return Logging.addMacroWarning('CPR', 'divine-strike', 'Already used this turn.');
    const config = automationUtils.getConfigValues(activity.item, ['formula', 'classIdentifier']);
    const subclass = workflow.actor.classes[config.classIdentifier]?.subclass?.identifier;
    const animation = automationUtils.getResolvedAnimation(activity.item, 'animation', config.animation);
    const playAnimation = animation?.animation && animationUtils.sequencerCheck() && animationUtils.jb2aCheck() === 'patreon' && animationUtils.aseCheck();
    return new DamageBonus(activity, {formula: config.formula, type: DAMAGE_TYPE[subclass] ?? 'radiant'})
        .withDefaultCosts()
        .withOnUse(async ({workflow}) => {
            if (playAnimation) animation.animation.macros.play(workflow);
            const combat = !!workflow.token.document.combatant;
            await workflowUtils.syntheticActivityRoll(activity, [], {consumeResources: combat, consumeUsage: combat});
        });
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
            type: 'formula',
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
