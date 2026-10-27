import {actorUtils} from '../../../proxy.mjs';
async function attack({workflow}) {
    if (workflow.item.type !== 'weapon' || workflow.activity.type !== 'attack') return;
    const spellcasting = workflow.actor.system.attributes.spellcasting;
    const weaponAbility = workflow.activity.ability || 'str';
    const ability = spellcasting ? actorUtils.getBestAbility(workflow.actor, [weaponAbility, spellcasting]) : weaponAbility;
    const activityData = workflow.activity.toObject();
    activityData.attack.ability = ability;
    workflow.item = workflow.item.clone({
        'system.properties': [...workflow.item.system.properties, 'mgc'],
        ['system.activities.' + workflow.activity.id]: activityData
    }, {keepId: true});
    workflow.activity = workflow.item.system.activities.get(workflow.activity.id);
}
export const tashasOtherworldlyGuise = {
    name: 'Tasha\'s Otherworldly Guise',
    version: '2.1.4',
    rules: '2014',
    roll: [
        {
            pass: 'actorPreambleComplete',
            macro: attack,
            priority: 50
        }
    ]
};
