import {constants, effectUtils, itemUtils} from '../../../../utils.js';

async function early({trigger: {entity: item}, workflow}) {
    if (workflow.targets.size > 1) return;
    if (workflow.activity.target.template.count) return;
    if (workflow.item.type !== 'spell') return;
    if (!itemUtils.getGenericFeatureConfig(item, 'spellTurning').advantage) return;
    let effectData = {
        name: item.name,
        img: constants.tempConditionIcon,
        duration: {
            seconds: 1
        },
        origin: item.uuid,
        changes: [
            {
                key: 'flags.midi-qol.magicResistance.all',
                mode: 0,
                value: 1,
                priority: 20
            }
        ],
        flags: {
            dae: {
                specialDuration: ['isSave']
            },
            'chris-premades': {
                effect: {
                    noAnimation: true
                }
            }
        }
    };
    await effectUtils.createEffect(item.actor, effectData);
}
async function postSave({trigger: {entity: item}, workflow}) {
    if (workflow.targets.size > 1) return;
    if (workflow.activity.target.template.count) return;
    if (workflow.failedSaves.size) return;
    if (workflow.item.type !== 'spell') return;
    let config = itemUtils.getGenericFeatureConfig(item, 'spellTurning');
    if (!config.targetCaster) return;
    if (workflow.spellLevel > config.spellLevel) return;
    await item.displayCard();
    workflow.targets = new Set([workflow.token]);
    workflow.hitTargets = workflow.targets;
    workflow.failedSaves = workflow.targets;
}
export let spellTurning = {
    name: 'Spell Turning',
    translation: 'CHRISPREMADES.Macros.SpellTurning.Name',
    version: '1.1.0',
    midi: {
        actor: [
            {
                pass: 'targetPreambleComplete',
                macro: early,
                priority: 50
            },
            {
                pass: 'targetSavesComplete',
                macro: postSave,
                priority: 50
            }
        ]
    },
    isGenericFeature: true,
    genericConfig: [
        {
            value: 'advantage',
            label: 'CHRISPREMADES.Macros.SpellTurning.Advantage',
            type: 'checkbox',
            default: true
        },
        {
            value: 'targetCaster',
            label: 'CHRISPREMADES.Macros.SpellTurning.TargetCaster',
            type: 'checkbox',
            default: true
        },
        {
            value: 'spellLevel',
            label: 'CHRISPREMADES.Macros.SpellTurning.SpellLevel',
            type: 'number',
            default: 7
        }
    ]
};