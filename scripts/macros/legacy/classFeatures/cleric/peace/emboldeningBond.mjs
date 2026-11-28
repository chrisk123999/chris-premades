import {activityUtils, actorUtils, automationUtils, D20Bonus, dataUtils, documentUtils, effectUtils, Logging, tokenUtils} from '../../../../../proxy.mjs';
async function makeBond({document: activity, macroClass: {identifier, source}, workflow}) {
    if (!workflow.targets.count) return;
    const effect = documentUtils.getEffectByIdentifier(activity.item, 'emboldeningBond')?.toObject();
    if (!effect) return Logging.addMacroWarning(source, identifier, `Emboldening Bond could not locate its active effect. (activity) ${activity.uuid} (effect identifier) emboldeningBond`);
    dataUtils.setOrigin(effect, activity);
    const range = activityUtils.getRange(activity);
    effect.duration = activityUtils.getEffectDuration(workflow.activity);
    const formula = automationUtils.getConfigValue(activity.item, 'formula');
    effect.system.changes.push(
        {key: 'system.attributes.init.roll.bonus',    type: 'add',      value: formula},
        {key: `flags.${source}.emboldeningBondBonus`, type: 'override', value: formula},
        {key: `flags.${source}.emboldeningBondRange`, type: 'override', value: range}
    );
    await automationUtils.calledEvent('preCreateEmboldeningBondEffect', workflow.actor, {canOverlap: true, data: {effectData: effect, workflow}});
    await Promise.all(workflow.targets.documents.map(t => effectUtils.createEffects(t.actor, [effect])));
}
async function bonus({document: effect, macroClass: {identifier, source}}) {
    const flags = effect.actor.flags[source];
    if (!flags || flags.emboldeningBondUsed || !flags.emboldeningBondRange) return;
    const self = actorUtils.getFirstToken(effect.actor);
    if (!self) return Logging.addMacroWarning(source, identifier, `Emboldening Bond could not grant a bonus to a character without a placed token. (effect) ${effect.uuid}`);
    if (!tokenUtils.findNearby(self, flags.emboldeningBondRange, {disposition: 'ally'})
        .filter(t => t.actor && actorUtils.getEffectByIdentifier(t.actor, 'emboldeningBond')).length
    ) return Logging.addMacroWarning(source, identifier, `Emboldening Bond could not grant a bonus to a character with no nearby bonded allies. (effect) ${effect.uuid} (token) ${self.uuid} (range) ${flags.emboldeningBondRange}`);
    return new D20Bonus(effect, {actor: effect.actor, formula: flags.emboldeningBondBonus, phase: 'preResult'})
        .withScalingHints(({bonus: b}) => b.scalingHints = [
            {label: effect.name, id: _loc('DND5E.AbilityUseConsumableLabel', {
                max: 1, per: CONFIG.DND5E.limitedUsePeriods.turn.abbreviation
            })} // sneak a custom label into the dialog thru id
        ])
        .withOnUse(oncePerTurn);
}
async function oncePerTurn({bonus, workflow}) {
    if (workflow) await MidiQOL.addCardNote(workflow, `<b>${bonus.document.name}</b>: ${_loc('DND5E.Attack')} +${bonus.roll.formula} (${bonus.roll.total})`);
    if (!bonus.actor.inCombat) return;
    const change = bonus.document.system.changes.find(c => c.key === 'flags.chris-premades.emboldeningBondUsed');
    if (!change) return;
    change.value = true;
    await documentUtils.update(bonus.document, {'system.changes': bonus.document.system.changes});
}
async function restoreUse({document: effect}) {
    const change = effect.system.changes.find(c => c.key === 'flags.chris-premades.emboldeningBondUsed');
    if (!change?.value) return;
    change.value = false;
    await documentUtils.update(effect, {'system.changes': effect.system.changes});
}
export const emboldeningBond = {
    name: 'Emboldening Bond',
    version: '2.1.11',
    rules: '2014',
    notes: 'Refund a used bonus by editing the change "flags.chris-premades.emboldeningBondUsed" in the active effect.\nUse the "actorPreCreateEmboldeningBondEffect" called event (async) to modify the granted bonus effect.\n\tData available: effectData, workflow.',
    roll: [
        {
            pass: 'activityRollFinished',
            macro: makeBond,
            priority: 50
        }
    ],
    config: {
        formula: {
            default: '1d4',
            type: 'formula',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Formula'
        }
    }
};
export const emboldeningBondEffect = {
    version: emboldeningBond.version,
    rules: emboldeningBond.rules,
    combat: [
        {
            pass: 'actorEveryTurn',
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
    check: [
        {
            pass: 'actorOptionalBonus',
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

