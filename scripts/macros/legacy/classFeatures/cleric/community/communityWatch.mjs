import {activityUtils, actorUtils, automationUtils, D20Bonus, dataUtils, documentUtils, effectUtils, Logging, tokenUtils} from '../../../../../proxy.mjs';
async function startWatch({document: activity, macroClass: {identifier, source}, workflow}) {
    if (!workflow.targets.count) return;
    const effect = documentUtils.getEffectByIdentifier(activity.item, 'communityWatch')?.toObject();
    if (!effect) return Logging.addMacroWarning(source, identifier, `Community Watch could not locate its active effect. (activity) ${activity.uuid} (effect identifier) communityWatch`);
    dataUtils.setOrigin(effect, activity);
    effect.duration = activityUtils.getEffectDuration(workflow.activity);
    const formula = automationUtils.getConfigValue(activity.item, 'formula');
    effect.system.changes.push({key: `flags.${source}.communityWatchBonus`, type: 'override', value: formula});
    await automationUtils.calledEvent('preCreateCommunityWatchEffect', workflow.actor, {canOverlap: true, data: {effectData: effect, workflow}});
    await Promise.all(workflow.targets.documents.map(t => effectUtils.createEffects(t.actor, [effect])));
}
async function bonus({document: effect, macroClass: {identifier, source}}) {
    const flags = effect.actor.flags[source];
    if (!flags || flags.communityWatchUsed) return;
    const self = actorUtils.getFirstToken(effect.actor);
    if (!self) return Logging.addMacroWarning(source, identifier, `Community Watch could not grant a bonus to a character without a placed token. (effect) ${effect.uuid}`);
    if (!self.scene.tokens.some(t => t.id !== self.id && !tokenUtils.isEnemy(self, t) && tokenUtils.canSee(self, t)))
        return Logging.addMacroWarning(source, identifier, `Community Watch could not grant a bonus to a character with no visible allies. (effect) ${effect.uuid} (token) ${self.uuid}`);
    return new D20Bonus(effect, {actor: effect.actor, formula: flags.communityWatchBonus, phase: 'preResult'})
        .withScalingHints(({bonus: b}) => b.scalingHints = [
            {label: effect.name, id: _loc('DND5E.AbilityUseConsumableLabel', {
                max: 1, per: CONFIG.DND5E.limitedUsePeriods.turnStart.abbreviation
            })} // sneak a custom label into the dialog thru id
        ])
        .withOnUse(oncePerRound);
}
async function oncePerRound({bonus, workflow}) {
    if (workflow) await MidiQOL.addCardNote(workflow, `<b>${bonus.document.name}</b>: ${_loc('DND5E.Attack')} +${bonus.roll.formula} (${bonus.roll.total})`);
    if (!bonus.actor.inCombat) return;
    const change = bonus.document.system.changes.find(c => c.key === 'flags.chris-premades.communityWatchUsed');
    if (!change) return;
    change.value = true;
    await documentUtils.update(bonus.document, {'system.changes': bonus.document.system.changes});
}
async function restoreUse({document: effect}) {
    const change = effect.system.changes.find(c => c.key === 'flags.chris-premades.communityWatchUsed');
    if (!change?.value) return;
    change.value = false;
    await documentUtils.update(effect, {'system.changes': effect.system.changes});
}
export const communityWatch = {
    name: 'Channel Divinity: Community Watch',
    version: '2.1.11',
    rules: '2014',
    notes: 'Refund a used bonus by editing the change "flags.chris-premades.communityWatchUsed" in the active effect.\nUse the "actorPreCreateCommunityWatchEffect" called event (async) to modify the granted bonus effect.\n\tData available: effectData, workflow.',
    roll: [
        {
            pass: 'activityRollFinished',
            macro: startWatch,
            priority: 50
        }
    ],
    config: {
        formula: {
            default: '1d6',
            type: 'formula',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Formula'
        }
    }
};
export const communityWatchEffect = {
    version: communityWatch.version,
    rules: communityWatch.rules,
    combat: [
        {
            pass: 'actorTurnStart',
            macro: restoreUse,
            priority: 50
        }
    ],
    roll: [
        {
            pass: 'actorOptionalBonusAttack',
            macro: bonus,
            priority: 200
        }
    ],
    save: [
        {
            pass: 'actorOptionalBonus',
            macro: bonus,
            priority: 200
        }
    ],
    skill: [
        {
            pass: 'actorOptionalBonus',
            macro: bonus,
            priority: 200
        }
    ]
};

