import {actorUtils, dataUtils, dialogUtils, genericUtils, itemUtils, Logging, workflowUtils} from '../../../../../proxy.mjs';
function log(src, id, msg, notify) {
    Logging.addMacroWarning(src, id, msg, {notify});
    return true;
}
async function frenzyRage({data, document: activity, macroClass: {rules, source}}) {
    if (!await dialogUtils.confirmUseItem(activity.item)) return;
    genericUtils.setProperty(data.effectData, `flags.${source}.frenzy`, activity.uuid);
    await itemUtils.unhideActivities(activity.item, [activity.id], {favorite: true, ids: true});
    return dataUtils.buildEffectData(data.effectData, {macros: [{type: 'effect', macros: [{source, rules, identifier: 'frenzyRageEnd'}]}]});
}
async function frenzyAttack({document: activity, macroClass: {identifier, source}}) {
    if (!activity.actor.flags[source]?.raging) return log(source, identifier, 'CHRISPREMADES.Macros.Modern.BranchesOfTheTree.Rage', true);
    const weapons = activity.actor.itemTypes.weapon.filter(w => ['simpleM', 'martialM', 'unarmed'].includes(w.system.type.value));
    if (!weapons.length) return log(source, identifier, 'CHRISPREMADES.Macros.Legacy.DedicatedWeapon.NoValid', true);
    let selected = weapons[0];
    if (weapons.length > 1) {
        selected = await dialogUtils.selectDocumentDialog(activity.item.name, 'CHRISPREMADES.Macros.Legacy.Frenzy', weapons, {displayTooltips: true});
        if (!selected) return log(source, identifier, `Frenzy Attack exited early due to a declined weapon choice prompt. (actor) ${activity.actor.uuid}`);
    }
    await workflowUtils.syntheticItemRoll(selected);
}
async function rageEnd({document: effect, macroClass: {source}}) {
    await actorUtils.addExhaustion(effect.actor);
    const activity = await fromUuid(effect.flags[source]?.frenzy);
    if (activity) await itemUtils.rehideActivities(activity.item, [activity.identifier], {favorite: true});
}
export const frenzy = {
    name: 'Frenzy',
    version: '2.1.4',
    rules: '2014',
    called: [
        {
            pass: 'actorPreCreateRageEffect',
            macro: frenzyRage,
            priority: 200
        }
    ],
    roll: [
        {
            pass: 'activityPreTargeting',
            macro: frenzyAttack,
            priority: 50
        }
    ]
};
export const frenzyRageEnd = {
    version: frenzy.version,
    rules: frenzy.rules,
    effect: [
        {
            pass: 'deleted',
            macro: rageEnd,
            priority: 50
        }
    ]
};
