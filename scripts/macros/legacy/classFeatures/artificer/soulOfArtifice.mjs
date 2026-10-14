import {actorUtils, documentUtils, Logging, queryUtils, uiUtils, workflowUtils} from '../../../../proxy.mjs';
import {swapArtificerPlan as artificer} from '../../../all.mjs';
async function cheatDeath({document: activity, ditem, macroClass: {identifier, source}}) {
    if (!ditem.isHit || ditem.newHP > 0 || ditem.newHP === ditem.oldHP) return;
    const maxHP = activity.actor.system.attributes.hp.effectiveMax;
    const resultingHP = ditem.oldHP + (ditem.oldTempHP ?? 0) - ditem.totalDamage;
    if (resultingHP <= -maxHP) 
        return Logging.addMacroWarning(source, identifier, `Soul of Artifice exited early, killed outright. (actor) ${activity.actor.uuid} (result hp) ${resultingHP} (max hp) ${maxHP}`);
    if (actorUtils.hasUsedReaction(activity.actor))
        return Logging.addMacroWarning(source, identifier, 'Soul of Artifice exited early due to a spent reaction.');
    const items = new Map(), inputs = new Map();
    for (const effect of actorUtils.getEffectByIdentifier(activity.actor, artificer.keys.createdEffectIdentifier, {multiple: true})) {
        const document = await fromUuid(effect.flags.dnd5e?.dependentOn);
        const item = document?.documentName === 'ActiveEffect' ? document.item: document;
        if (!item) continue;
        const key = `${item.actor.id}|${item.id}`;
        const group = inputs.get(item.actor.uuid) ?? ['button', [], {displayAsRows: true, legend: item.actor.name}];
        const uses = item.system.uses;
        group[1].push({
            name: key,
            label: item.name + (uses.max > 0 ? ` - ${uses.value}/${uses.max}` : ''),
            options: {
                image: item.img,
                tooltip: await uiUtils.enrichHTML(item.system.description.value, item.getRollData())
            }
        });
        items.set(key, effect);
        inputs.set(item.actor.uuid, group);
    }
    if (!items.size) return Logging.addMacroWarning(source, identifier, 'Soul of Artifice exited early without any valid items.');
    const choice = await queryUtils.query(
        'dialog',
        queryUtils.firstOwner(activity.actor),
        {
            title: activity.item.name,
            content: 'CHRISPREMADES.Macros.Legacy.SoulOfArtifice',
            inputs: Array.from(inputs.values()),
            buttons: 'cancel'
        }, 
        300000
    );
    const item = items.get(choice?.buttons);
    if (!item) return Logging.addMacroWarning(source, identifier, 'Soul of Artifice exited early due to a declined prompt.');
    workflowUtils.preventZeroHP(ditem);
    await documentUtils.deleteDocument(item);
    await workflowUtils.syntheticActivityRoll(activity);
}
export const soulOfArtifice = {
    name: 'Soul of Artifice',
    version: '2.1.3',
    rules: '2014',
    roll: [
        {
            pass: 'targetDamageComplete',
            macro: cheatDeath,
            priority: 300
        }
    ]
};
