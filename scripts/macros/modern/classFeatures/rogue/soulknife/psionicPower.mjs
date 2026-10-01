import {documentUtils, effectUtils} from '../../../../../proxy.mjs';
async function whispersCost({activity, config}) {
    if (activity.identifier !== 'psychic-whispers') return;
    config.consume ??= {};
    config.consume.resources = activity.uses.value ? [0] : [1];
}
async function psychicWhispers({workflow}) {
    const sourceEffect = workflow.item.effects.contents?.[0];
    if (!sourceEffect) return;
    const effectData = documentUtils.getEffectData(workflow.item, sourceEffect.id, {duration: {value: workflow.utilityRolls[0].total, units: 'hours'}});
    const targets = new Set(workflow.targets);
    targets.add(workflow.token);
    await Promise.all(Array.from(targets).filter(token => token.actor).map(token => effectUtils.createEffects(token.actor, [effectData])));
}
export const psionicPower = {
    name: 'Psionic Power',
    version: '2.0.0',
    rules: '2024',
    roll: [
        {
            pass: 'activityPreTargeting',
            macro: whispersCost,
            priority: 50
        },
        {
            pass: 'activityRollFinished',
            macro: psychicWhispers,
            priority: 50
        }
    ],
    config: {
        subclassIdentifier: {
            default: 'soulknife',
            type: 'text',
            label: 'CHRISPREMADES.Config.SubclassIdentifier',
            category: 'homebrew'
        }
    },
    scales: [
        {
            identifier: 'energy-die',
            classIdentifier: 'soulknife',
            data: {
                type: 'ScaleValue',
                configuration: {
                    identifier: 'energy-die',
                    type: 'dice',
                    distance: {
                        units: ''
                    },
                    scale: {
                        3: {
                            number: 4,
                            faces: 6,
                            modifiers: []
                        },
                        5: {
                            number: 6,
                            faces: 8,
                            modifiers: []
                        },
                        9: {
                            number: 8,
                            faces: 8,
                            modifiers: []
                        },
                        11: {
                            number: 8,
                            faces: 10,
                            modifiers: []
                        },
                        13: {
                            number: 10,
                            faces: 10,
                            modifiers: []
                        },
                        17: {
                            number: 12,
                            faces: 12,
                            modifiers: []
                        }
                    }
                },
                value: {},
                title: 'Energy Die'
            }
        }
    ]
};
