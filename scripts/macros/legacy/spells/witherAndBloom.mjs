import {actorUtils, activityUtils, automationUtils, dialogUtils, itemUtils, Logging, queryUtils, workflowUtils} from '../../../proxy.mjs';
import {playAreaAnimation} from '../../generic/spellAnimation.mjs';
function damage({workflow, targetToken, ditem}) {
    if (!workflow.token || workflow.activity.identifier === 'bloom') return;
    if (targetToken.disposition !== workflow.token.document.disposition) return;
    workflowUtils.negateDamageItemDamage(ditem);
}
async function late({document, workflow}) {
    if (!workflow.token || workflow.activity.identifier === 'bloom') return;
    const {animation, options} = automationUtils.getResolvedAnimation(document, 'animation');
    playAreaAnimation(workflow, {animation, options});
    const allies = Array.from(workflow.targets).filter(token => token.document.disposition === workflow.token.document.disposition && token.actor?.type === 'character').map(token => token.document);
    if (!allies.length) return Logging.addMacroWarning('CPR', 'wither-and-bloom', 'No allied character in the area to heal.');
    let target = allies[0];
    if (allies.length > 1) {
        const selection = await dialogUtils.selectTargetDialog(document.name, _loc('CHRISPREMADES.Macros.Legacy.WitherAndBloom.SelectTarget'), allies, {skipDeadAndUnconscious: false});
        if (!selection?.result) return Logging.addMacroWarning('CPR', 'wither-and-bloom', 'No creature chosen to heal.');
        target = selection.result;
    }
    const activity = itemUtils.getActivityByIdentifier(document, 'bloom');
    if (!activity) return Logging.addMacroWarning('CPR', 'wither-and-bloom', 'Bloom activity missing from item.', {notify: 'warn'});
    const userId = queryUtils.firstOwner(target, true);
    const selections = await dialogUtils.selectHitDie(target.actor, document.name, _loc('CHRISPREMADES.Macros.Legacy.WitherAndBloom.SelectHitDie'), {max: workflowUtils.getCastLevel(workflow) + automationUtils.getConfigValue(document, 'hitDiceOffset'), userId});
    const {count, formula} = await actorUtils.spendHitDice(target.actor, selections, {roll: false});
    if (!count) return Logging.addMacroWarning('CPR', 'wither-and-bloom', 'No Hit Dice spent.');
    if (animation?.macros?.heal) animation.macros.heal(target);
    const activityData = activityUtils.getDamageModifiedActivityData(activity, formula + ' + @mod');
    await workflowUtils.syntheticActivityDataRoll(activityData, document, [target], {spellSlot: false, consumeUsage: false, consumeResources: false});
}
export const witherAndBloom = {
    name: 'Wither and Bloom',
    version: '2.1.3',
    rules: '2014',
    roll: [
        {
            pass: 'itemDamageComplete',
            macro: damage,
            priority: 50
        },
        {
            pass: 'itemRollFinished',
            macro: late,
            priority: 50
        }
    ],
    config: {
        hitDiceOffset: {
            default: -1,
            type: 'number',
            label: 'CHRISPREMADES.Macros.Legacy.WitherAndBloom.HitDiceOffset',
            hint: 'CHRISPREMADES.Macros.Legacy.WitherAndBloom.HitDiceOffsetHint',
            category: 'homebrew'
        },
        animation: {
            default: {
                source: 'chris-premades',
                identifier: 'witherAndBloom'
            },
            type: 'selectAnimation',
            inputs: ['sourceToken', 'region', 'options'],
            label: 'CHRISPREMADES.Config.Animation',
            category: 'animations'
        }
    }
};
