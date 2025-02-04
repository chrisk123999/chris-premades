import {dialogUtils, effectUtils, genericUtils, itemUtils, rollUtils, socketUtils, workflowUtils} from '../../../../utils.js';
async function saveCheckSkill({trigger: {config, roll, entity: effect}}) {
    let targetValue = config?.midiOptions?.targetValue;
    if (targetValue) {
        if (roll.total >= targetValue) return;
    }
    let formula = effect.flags['chris-premades']?.bardicInspiration?.formula;
    if (!formula) return;
    let selection = await dialogUtils.confirm(effect.name, genericUtils.format('CHRISPREMADES.Dialog.UseRollTotal', {itemName: effect.name + ' (' + formula + ')', rollTotal: roll.total}));
    if (!selection) return;
    await genericUtils.remove(effect);
    return await rollUtils.addToRoll(roll, formula);
}
async function attack({trigger: {entity: effect}, workflow}) {
    if (!workflow.targets.size|| workflow.isFumble) return;
    if (workflow.targets.first().actor.system.attributes.ac.value <= workflow.attackTotal) return;
    let formula = effect.flags['chris-premades']?.bardicInspiration?.formula;
    if (!formula) return;
    let selection = await dialogUtils.confirm(effect.name, genericUtils.format('CHRISPREMADES.Dialog.UseAttack', {itemName: effect.name + ' (' + formula + ')', rollTotal: workflow.attackTotal}));
    if (!selection) return;
    await genericUtils.remove(effect);
    await workflowUtils.bonusAttack(workflow, formula);
}
async function use({trigger, workflow}) {
    if (!workflow.targets.size) return;
    let classIdentifier = itemUtils.getConfig(workflow.item, 'classIdentifier') ?? 'bard';
    let scaleIdentifier = itemUtils.getConfig(workflow.item, 'scaleIdentifier') ?? 'inspiration';
    let scale = workflow.actor.system.scale[classIdentifier]?.[scaleIdentifier];
    if (!scale) return;
    let sourceEffect = workflow.item.effects.contents?.[0];
    if (!sourceEffect) return;
    let effectData = genericUtils.duplicate(sourceEffect.toObject());
    effectData.duration = itemUtils.convertDuration(workflow.activity);
    genericUtils.setProperty(effectData, 'flags.chris-premades.bardicInspiration.formula', scale.formula);
    await Promise.all(workflow.targets.map(async token => await effectUtils.createEffect(token.actor, effectData)));
}
export let bardicInspiration = {
    name: 'Bardic Inspiration',
    version: '1.1.30',
    rules: 'modern',
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
            value: 'classIdentifier',
            label: 'CHRISPREMADES.Config.ClassIdentifier',
            type: 'text',
            default: 'bard',
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'scaleIdentifier',
            label: 'CHRISPREMADES.Config.ScaleIdentifier',
            type: 'text',
            default: 'bardic-inspiration',
            category: 'homebrew',
            homebrew: true
        }
    ],
    scales: [
        {
            type: 'ScaleValue',
            configuration: {
                distance: {
                    units: ''
                },
                identifier: 'bardic-inspiration',
                type: 'dice',
                scale: {
                    1: {
                        number: 1,
                        faces: 6,
                        modifiers: []
                    },
                    5: {
                        number: 1,
                        faces: 8,
                        modifiers: []
                    },
                    10: {
                        number: 1,
                        faces: 10,
                        modifiers: []
                    },
                    15: {
                        number: 1,
                        faces: 12,
                        modifiers: []
                    }
                }
            },
            value: {},
            title: 'Bardic Inspiration',
            icon: null
        }
    ]
};
export let bardicInspirationEffect = {
    name: bardicInspiration.name,
    version: bardicInspiration.version,
    rules: bardicInspiration.rules,
    midi: {
        actor: [
            {
                pass: 'postAttackRoll',
                macro: attack,
                priority: 100
            }
        ]
    },
    save: [
        {
            pass: 'bonus',
            macro: saveCheckSkill,
            priority: 50
        }
    ],
    skill: [
        {
            pass: 'bonus',
            macro: saveCheckSkill,
            priority: 50
        }
    ],
    check: [
        {
            pass: 'bonus',
            macro: saveCheckSkill,
            priority: 50
        }
    ]
};