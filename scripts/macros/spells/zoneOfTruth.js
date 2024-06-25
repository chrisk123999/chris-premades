import {combatUtils, compendiumUtils, constants, genericUtils, itemUtils} from '../../utils.js';
async function enter(trigger) {
    console.log(trigger);
    if (combatUtils.inCombat()) {
        let touchedTokens = trigger.entity.flags['chris-premades']?.zoneOfTruth?.touchedTokens?.[combatUtils.currentTurn()];
        if (touchedTokens.includes(trigger.token.id)) return;
        touchedTokens.push(trigger.token.id);
        await genericUtils.setFlag(trigger.entity, 'chris-premades', 'zoneOfTruth.touchedTokens', touchedTokens);
    }
    let featureData = await compendiumUtils.getItemFromCompendium(constants.packs.spellFeatures, 'Zone of Truth: Save', {getDescription: true, translate: true, identifier: 'zoneOfTruthSave', object: true});

}
async function use({trigger, workflow}) {
    if (!workflow.template) return;
    await genericUtils.update(workflow.template, {
        flags: {
            'chris-premades': {
                castData: {
                    castLevel: workflow.castData.castLevel,
                    baseLevel: workflow.castData.baseLevel,
                    saveDC: itemUtils.getSaveDC(workflow.item)
                },
                template: {
                    name: workflow.item.name
                },
                macros: {
                    template: ['zoneOfTruth'],
                    combat: ['zoneOfTruth']
                }
            }
        }
    });
}
async function turnStart(trigger) {
    console.log(trigger);
}
export let zoneOfTruth = {
    name: 'Zone of Truth',
    version: '0.12.0',
    midi: {
        item: [
            {
                pass: 'RollComplete',
                macro: use,
                priority: 50
            }
        ]
    },
    template: [
        {
            pass: 'enter',
            macro: enter,
            priority: 50
        }
    ],
    combat: [
        {
            pass: 'turnStart',
            macro: turnStart,
            priority: 50
        }
    ]
};