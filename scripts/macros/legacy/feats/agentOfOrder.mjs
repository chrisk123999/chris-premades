import {actorUtils, documentUtils} from '../../../proxy.mjs';
async function added({document: item}) {
    if (!item.actor) return;
    const scion = item.actor.items.find(feat => documentUtils.getIdentifier(feat)?.startsWith('scion-of-the-outer-planes'));
    const ability = scion?.system.activities.getByType('cast')[0]?.spell.ability || actorUtils.getBestAbility(item.actor, ['int', 'wis', 'cha']);
    const formula = '8 + @prof + @abilities.' + ability + '.mod';
    const updates = {};
    for (const activity of item.system.activities.getByType('save')) {
        if (activity.save.dc.formula === formula) continue;
        updates['system.activities.' + activity.id + '.save.dc.calculation'] = '';
        updates['system.activities.' + activity.id + '.save.dc.formula'] = formula;
    }
    if (Object.keys(updates).length) await documentUtils.update(item, updates);
}
export const agentOfOrder = {
    name: 'Agent of Order: Stasis Strike',
    version: '2.1.9',
    rules: '2014',
    roll: [
        {pass: 'actorOptionalBonusDamage', macro: added, priority: 200}
    ],
    item: [
        {pass: 'created', macro: added, priority: 50},
        {pass: 'medkit', macro: added, priority: 50},
        {pass: 'munched', macro: added, priority: 50}
    ]
};
