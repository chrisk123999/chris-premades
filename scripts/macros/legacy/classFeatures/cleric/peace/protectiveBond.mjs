import {actorUtils, applications, automationUtils, dialogUtils, documentUtils, genericUtils, Logging, queryUtils, tokenUtils, workflowUtils} from '../../../../../proxy.mjs';
async function editBond({document: activity, data}) {
    const macro = {source: 'chris-premades', rules: protectiveBond.rules, identifier: 'protectiveBondEffect'};
    if (data.effectData.flags.cat?.macros?.roll)
        data.effectData.flags.cat.macros.roll.push(macro);
    else
        genericUtils.setProperty(data.effectData, 'flags.cat.macros.roll', [macro]);
    const config = automationUtils.getConfigValues(activity.item, Object.keys(protectiveBond.config));
    genericUtils.setProperty(data.effectData, 'flags.chris-premades.protectiveBond', {...config, activity: activity.uuid});
}
async function swapDamage({document: effect, ditem, targetToken, macroClass: {identifier, source}, workflow}) {
    if (!tokenUtils.isEnemy(targetToken, workflow.tokenDocument)) return;
    if (!ditem.isHit || !ditem.totalDamage || ditem.oldHP === 0) return;
    const range = effect.actor.flags[source]?.emboldeningBondRange;
    const {protectiveBond: bond, expansiveBond} = effect.flags[source] ?? {};
    if (!range || !bond) return;
    const activity = await fromUuid(bond.activity);
    if (!activity) return Logging.addMacroWarning(source, identifier, `Protective Bond could not locate its activity. (effect) ${effect.uuid} (activity) ${bond.activity}`);
    if (bond.bloodied && !actorUtils.isBloodied(targetToken.actor))
        return Logging.addMacroWarning(source, identifier, `Protective Bond was skipped on a character that is not bloodied. (effect) ${effect.uuid} (token) ${targetToken.uuid}`);
    if (bond.percent > 0) {
        const pct = ditem.totalDamage / targetToken.actor.system.attributes.hp.effectiveMax * 100;
        if (pct < bond.percent)
            return Logging.addMacroWarning(source, identifier, `Protective Bond was skipped for a damage total less than the threshold. (effect) ${effect.uuid} (token) ${targetToken.uuid} (dealt percentage) ${pct}`);
    }
    const near = tokenUtils.findNearby(targetToken, range, {disposition: 'ally'})
        .filter(t => t.actor && !actorUtils.hasUsedReaction(t.actor) && actorUtils.getEffectByIdentifier(t.actor, 'emboldeningBond'));
    if (!near.length)
        return Logging.addMacroWarning(source, identifier, `Protective Bond was skipped on a character with no nearby bonded allies. (effect) ${effect.uuid} (token) ${targetToken.uuid} (range) ${range}`);
    const options = {};
    workflowUtils.setWorkflowProperty(options, 'protectiveBond', ditem.totalDamage);
    await workflowUtils.syntheticItemDataRoll(activity.item.toObject(), targetToken.actor, near, {options, userId: queryUtils.firstOwner(targetToken.actor, true)});
    const id = targetToken.actor.flags['chris-premades']?.protectiveBondAlly;
    // eslint-disable-next-line no-undef
    await documentUtils.update(targetToken.actor, {'flags.chris-premades.protectiveBondAlly': _del});
    const ally = near.find(t => t.id === id);
    if (!ally) return Logging.addMacroWarning(source, identifier, `Protective Bond could not locate the chosen ally token. (effect) ${effect.uuid} (ally id) ${id}`);
    await workflowUtils.syntheticItemDataRoll(activity.item.toObject(), ally.actor, [targetToken], {userId: queryUtils.firstOwner(ally.actor, true)});
    const resist = MidiQOL.configSettings().damageResistanceMultiplier;
    const newDamage = expansiveBond ? ditem.damages.map(d => {
        const clone = genericUtils.duplicate(d);
        clone.potential = clone.active = {multiplier: resist, type: {resistance: true}};
        clone.value = Math.floor(clone.damage * resist);
        clone.properties = d.properties;
        return clone;
    }) : ditem.damages;
    await MidiQOL.applyTokenDamage(newDamage, workflow.damageTotal, [ally], workflow.item, new Set(), {workflow});
    workflowUtils.negateDamageItemDamage(ditem);
}
async function prompt({activity, config}) {
    const damage = workflowUtils.getWorkflowProperty(config.workflow, 'protectiveBond');
    if (!damage) return;
    const choice = await applications.DialogApp.dialog(
        activity.item.name,
        _loc('CHRISPREMADES.Macros.Legacy.ProtectiveBond.Prompt', {damage}),
        [['request', Array.from(config.midiOptions.targetsToUse).map(t => ({
            label: t.name,
            name: t.id,
            onrequest: async () => {
                const user = queryUtils.firstOwner(t.actor);
                if (user.id === game.user.id) return {result: true, reason: _loc('CAT.Dialog.Request.Self')};
                const result = await dialogUtils.confirm(
                    activity.item.name,
                    _loc('CHRISPREMADES.Macros.Legacy.ProtectiveBond.Request', {target: activity.actor.name, damage}),
                    {userId: user.id}
                );
                return result ? result : {result, reason: `${user.name} ${_loc('CAT.Dialog.Request.Declined')}`};
            },
            options: {
                image: t.texture.src,
                tags: [{label: `${_loc('DND5E.HP')} ${t.actor.system.attributes.hp.value} / ${t.actor.system.attributes.hp.effectiveMax}`, id: 'hp'}],
                onchange: ({group, input}) => {
                    if (!input.isChecked) return;
                    group.options.forEach(o => o.locked = o.id !== input.id);
                    return true;
                }
            }
        }))]],
        'okCancel',
        {timer: true}
    );
    if (!choice?.buttons) return;
    const id = Object.entries(choice).find(e => e[1] === 'true')?.[0];
    await documentUtils.setFlag(activity.actor, 'chris-premades', 'protectiveBondAlly', id);
    return true;
}
export const protectiveBond = {
    name: 'Protective Bond',
    version: '2.1.11',
    rules: '2014',
    called: [
        {
            pass: 'actorPreCreateEmboldeningBondEffect',
            macro: editBond,
            priority: 200
        }
    ],
    roll: [
        {
            pass: 'activityPreTargeting',
            macro: prompt,
            priority: 50
        }
    ],
    config: {
        bloodied: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'EFFECT.DND5E.StatusBloodied',
            hint: 'CHRISPREMADES.Macros.Legacy.ProtectiveBond.BloodiedHint'
        },
        percent: {
            default: 0,
            type: 'number',
            category: 'behavior',
            max: 100, min: 0, step: 1,
            label: 'CHRISPREMADES.Macros.All.PreserveLife.Limit',
            hint: 'CHRISPREMADES.Macros.Legacy.ProtectiveBond.PercentHint'
        }
    }
};
export const protectiveBondEffect = {
    version: protectiveBond.version,
    rules: protectiveBond.rules,
    roll: [
        {
            pass: 'targetDamageFlatReductions',
            macro: swapDamage,
            priority: 300,
            thirdParty: true
        }
    ]
};
