import {actorUtils, constants, itemUtils, workflowUtils} from '../../../../../utils.js';
async function use({trigger: {entity: item}, workflow}) {
    if (!workflowUtils.isAttackType(workflow, 'weaponAttack')) return;
    if (!workflow.item.system.properties?.has('mgc')) return;
    let ability = itemUtils.getConfig(item, 'attackAbility') || 'int';
    let weaponAbility = workflow.activity.attack.ability ?? 'str';
    let abilities = [ability, weaponAbility];
    if (workflow.item.system.properties.has('fin')) abilities.push('dex');
    let bestAbility = actorUtils.getBestAbility(workflow.actor, abilities);
    if (bestAbility === weaponAbility) return;
    let activity = workflow.activity.clone({ 'attack.ability': bestAbility }, { keepId: true });
    workflow.item = itemUtils.cloneItem(workflow.item, {
        ['system.activities.' + workflow.activity.id]: activity
    });
    workflow.activity = workflow.item.system.activities.get(workflow.activity.id);
}
export let battleReady = {
    name: 'Battle Ready',
    version: '1.5.17',
    midi: {
        actor: [
            {
                pass: 'preambleComplete',
                macro: use,
                priority: 500
            }
        ]
    },
    config: [
        {
            value: 'attackAbility',
            label: 'CHRISPREMADES.Config.Ability',
            type: 'select',
            default: 'int',
            options: constants.abilityOptions,
            category: 'homebrew',
            homebrew: true
        }
    ]
};
