import {activityUtils, dialogUtils, effectUtils, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../../../utils.js';
import {proneOnFail} from '../../generic/proneOnFail.js';
async function use({trigger: {entity: item}, workflow}) {
    let activities = workflow['chris-premades']?.cunningStrike?.activities;
    if (!activities) return;
    let versatileTrickster = itemUtils.getItemByIdentifier(workflow.actor, 'versatileTrickster');
    for (let activityUuid of activities) {
        let activity = await fromUuid(activityUuid);
        if (!activity) break;
        let identifier = activityUtils.getIdentifier(activity);
        let targets = Array.from(workflow.targets);
        if (versatileTrickster && identifier === 'trip' && workflow.token) {
            let mageHand = itemUtils.getItemByIdentifier(workflow.actor, 'mageHand');
            let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'mageHand');
            if (effect && item) {
                let id = effect.flags['chris-premades'].summons.ids[mageHand.name][0];
                let mageHandToken = workflow.token.document.parent.tokens.get(id);
                if (mageHandToken) {
                    let nearbyTokens = tokenUtils.findNearby(mageHandToken.object, 5, 'all', {includeIncapacitated: true}).filter(token => token.document.disposition != workflow.token.document.disposition && !workflow.targets.has(token));
                    if (nearbyTokens.length) {
                        let selection = await dialogUtils.selectTargetDialog(item.name, genericUtils.format('CHRISPREMADES.Dialog.Use', {itemName: versatileTrickster.name}), nearbyTokens, {skipDeadAndUnconscious: false});
                        if (selection?.length) {
                            targets.push(selection[0]);
                        }
                    }
                }
            }
        }
        await workflowUtils.syntheticActivityRoll(activity, targets);
    }
}
export let cunningStrike = {
    name: 'Cunning Strike',
    version: '1.3.36',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: proneOnFail.midi.item[0].macro,
                priority: 50,
                activities: ['trip']
            }
        ],
        actor: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 300,
                unique: 'cunningStrikeUse'
            }
        ]
    },
    config: [
        {
            value: 'uses',
            label: 'CHRISPREMADES.Config.SimultaneousUses',
            type: 'number',
            default: 1,
            category: 'homebrew',
            homebrew: true
        }
    ]
};