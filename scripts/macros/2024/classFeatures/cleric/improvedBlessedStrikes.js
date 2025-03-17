import {activityUtils, dialogUtils, itemUtils, tokenUtils, workflowUtils} from '../../../../utils.js';

async function use({trigger: {entity: item}, workflow}) {
    if (workflow.item?.type != 'spell' || !workflow.activity || !workflow.token || !workflow.castData) return;
    if (!itemUtils.getItemByIdentifier(workflow.actor, 'potentSpellcasting')) return;
    if (workflowUtils.getCastLevel(workflow) != 0) return;
    let classIdentifier = itemUtils.getConfig(item, 'classIdentifier');
    if (workflow.item.system.sourceClass != classIdentifier) return;
    if (activityUtils.isSpellActivity(workflow.activity)) return;
    let range = itemUtils.getActivity(item, 'heal').range.value ?? 60;
    let nearbyTokens = tokenUtils.findNearby(workflow.token, range, 'ally', {includeIncapacitated: true, includeToken: true});
    let selection;
    if (nearbyTokens.length === 1) {
        selection = nearbyTokens[0];
    } else {
        let selected = await dialogUtils.selectTargetDialog(item.name, 'CHRISPREMADES.Macros.ImprovedPotentSpellcasting.Target', nearbyTokens, {skipDeadAndUnconscious: false});
        if (!selected?.length) return;
        selection = selected[0];
    }
    await workflowUtils.syntheticItemRoll(item, [selection]);
}
export let improvedBlessedStrikes = {
    name: 'Improved Blessed Strikes',
    version: '1.2.28',
    rules: 'modern',
    aliases: ['Improved Blessed Strikes: Divine Strike', 'Improved Blessed Strikes: Potent Spellcasting'],
    midi: {
        actor: [
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
            default: 'cleric',
            category: 'homebrew',
            homebrew: true
        }
    ]
};