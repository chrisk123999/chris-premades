import {actorUtils, automationUtils, constants, dialogUtils, documentUtils, Logging, queryUtils, tokenUtils, workflowUtils} from '../../../../../proxy.mjs';
function log(msg, notify) {
    Logging.addMacroWarning('chris-premades', 'warding-flare', msg, {notify});
}
async function attacked({document: activity, workflow}) {
    if (workflow.tracker.hasDisadvantage) return;
    if (!workflowUtils.isAttackType(workflow, 'attack')) return;
    const attacker = workflow.token?.document;
    const attacked = workflow.targets.tokens[0]?.document;
    const token = actorUtils.getFirstToken(activity.actor);
    if (!token) return log(`Warding Flare exited early with no placed token. (attacked) ${activity.uuid}`);
    if (!attacked) return log(`Warding Flare exited early on a target without a placed token. (activity) ${activity.uuid}`);
    if (!attacker) return log(`Warding Flare exited early on an attacker without a placed token. (attacked) ${attacked.uuid}`);
    if (
        attacked.uuid !== token.uuid &&
        documentUtils.getRules(activity.item) === '2014' &&
        !actorUtils.getItemByIdentifiers(activity.actor, ['improved-flare', 'improved-warding-flare'], {type: 'feat'})
    ) return;
    if (!activity.item.system.uses.value)
        return log(`Warding Flare exited early with no item uses. (activity) ${activity.uuid}`);
    if (tokenUtils.isEnemy(attacked, token)) return;
    if (actorUtils.hasUsedReaction(activity.actor))
        return log(`Warding flare exited early with an already spent reaction. (attacked) ${attacked.uuid}`);
    if (!tokenUtils.canSee(token, attacker))
        return log(`Warding Flare exited early on an unseen attacker. (attacked) ${attacked.uuid} (attacker) ${attacker.uuid}`);
    const range = MidiQOL.checkActivityRange(activity, token, [attacker], false);
    if (!range || range.result === 'fail')
        return log(`Warding Flare exited early for an attacker out of range. (attacked) ${attacked.uuid} (attacker) ${attacker.uuid} (range) ${range?.range}`);
    if (!await dialogUtils.confirmUseItem(activity.item, {userId: queryUtils.firstOwner(activity.actor, true)})) return;
    await workflowUtils.syntheticActivityRoll(activity, [attacked]);
    const immune = automationUtils.getConfigValue(activity.item, 'immune');
    if (immune?.some(i => actorUtils.checkTrait(workflow.actor, 'ci', i))) return log('CHRISPREMADES.Macros.All.CuttingWords.Immune', true);
    workflow.tracker.disadvantage.add('warding-flare', activity.item.name);
}
export const wardingFlare = {
    name: 'Warding Flare',
    version: '2.1.9',
    rules: 'all',
    roll: [
        {
            pass: 'sceneAttackRollConfig',
            macro: attacked,
            priority: 300,
            canOverlap: true
        }
    ],
    config: {
        immune: {
            default: ['blinded'],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Legacy.IntimidatingPresence.Immune',
            hint: 'CHRISPREMADES.Macros.All.WardingFlare.ImmuneHint',
            get options() { return constants.statusOptions; }
        }
    }
};
