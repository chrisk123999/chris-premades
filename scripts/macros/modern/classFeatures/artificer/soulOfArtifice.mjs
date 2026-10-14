import {actorUtils, automationUtils, constants, documentUtils, Logging, queryUtils, uiUtils, workflowUtils} from '../../../../proxy.mjs';
import {swapArtificerPlan as artificer} from '../../../all.mjs';
async function cheatDeath({document: activity, ditem, macroClass: {identifier, source}}) {
    if (!ditem.isHit || ditem.newHP > 0 || ditem.newHP === ditem.oldHP) return;
    const maxHP = activity.actor.system.attributes.hp.effectiveMax;
    const resultingHP = ditem.oldHP + (ditem.oldTempHP ?? 0) - ditem.totalDamage;
    if (resultingHP <= -maxHP) 
        return Logging.addMacroWarning(source, identifier, `Soul of Artifice exited early, killed outright. (actor) ${activity.actor.uuid} (result hp) ${resultingHP} (max hp) ${maxHP}`);
    const config = automationUtils.getConfigValues(activity.item, Object.keys(soulOfArtifice.config));
    const items = new Map(), inputs = new Map();
    for (const effect of actorUtils.getEffectByIdentifier(activity.actor, artificer.keys.createdEffectIdentifier, {multiple: true})) {
        const document = await fromUuid(effect.flags.dnd5e?.dependentOn);
        const item = document?.documentName === 'ActiveEffect' ? document.item: document;
        if (!item) continue;
        const rarity = item.system.rarity;
        if (config.rarity.length && !config.rarity.includes(rarity)) continue;
        const key = `${item.actor.id}|${item.id}`;
        const group = inputs.get(item.actor.uuid) ?? ['checkbox', [], {displayAsRows: true, legend: item.actor.name}];
        const tags = [{label: CONFIG.DND5E.itemRarity[rarity] ?? rarity, id: 'rarity'}];
        if (item.system.uses?.max > 0) tags.push({
            label: `${item.system.uses.value}/${item.system.uses.max} ${_loc('DND5E.Uses')}`, id: 'uses'
        });
        group[1].push({
            name: key,
            label: item.name,
            options: {
                tags,
                image: item.img,
                tooltip: await uiUtils.enrichHTML(item.system.description.value, item.getRollData())
            }
        });
        items.set(key, item);
        inputs.set(item.actor.uuid, group);
    }
    if (!items.size) return Logging.addMacroWarning(source, identifier, `Soul of Artifice exited early without any valid items. (rarities) ${config.rarity.join(', ')}`);
    const choice = await queryUtils.query(
        'dialog',
        queryUtils.firstOwner(activity.actor),
        {
            title: activity.item.name,
            content:  _loc('CHRISPREMADES.Macros.Modern.SoulOfArtifice.Prompt', {amount: config.hp}),
            inputs: Array.from(inputs.values()),
            buttons: 'okCancel'
        }, 
        300000
    );
    if (!choice?.buttons) return Logging.addMacroWarning(source, identifier, 'Soul of Artifice exited early due to a declined prompt.');
    const results = Object.entries(choice).filter(c => c[1] && items.get(c[0])).map(i => items.get(i[0]));
    if (!results.length) return Logging.addMacroWarning(source, identifier, 'Soul of Artifice exited early due to a declined prompt.');
    workflowUtils.preventZeroHP(ditem, {targetHP: results.length * config.hp});
    await Promise.all(results.map(i => documentUtils.deleteDocument(i)));
    await workflowUtils.syntheticActivityRoll(activity, [], {config: {scaling: results.length - 1}});
}
export const soulOfArtifice = {
    name: 'Soul of Artifice',
    version: '2.1.3',
    rules: '2024',
    roll: [
        {
            pass: 'targetDamageComplete',
            macro: cheatDeath,
            priority: 300
        }
    ],
    config: {
        hp: {
            default: 20,
            type: 'number',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Modern.SoulOfArtifice.HPPerItem'
        },
        rarity: {
            default: ['uncommon', 'rare'],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Modern.SoulOfArtifice.Rarity',
            get options() { return constants.itemRarities; }
        }
    }
};
