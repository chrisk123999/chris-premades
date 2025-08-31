import {actorUtils, genericUtils, itemUtils, tokenUtils, rollUtils, workflowUtils} from '../../../../utils.js';
async function early({workflow}) {
    let config = itemUtils.getGenericFeatureConfig(workflow.item, 'movementBonusActivity');
    if (!config.damageBonus.length) return;
    // Check activities
    let activities = config.activities;
    if (activities?.length && !activities.includes(workflow.activity.id)) return;
    // Check distance
    if (tokenUtils.getLinearDistanceMoved(workflow.token) < config.distance) return;
    // Check size
    if (config.maxSize && config.maxSize != 'none' && !actorUtils.compareSize(workflow.targets.first(), config.maxSize, '<=')) return;
    let lastMovementId = workflow.token.document.movementHistory.at(-1).movementId;
    let combatant = game?.combat.combatants.find(i => i.tokenId === workflow.token.id);
    if (combatant.flags['chris-premades']?.movementBonusActivity?.lastMovementId === lastMovementId) return;
    let formula = config.damageBonus;
    if (config.replaceDamageFormula) {
        let damageRoll = rollUtils.damageRoll(formula, workflow.item, workflow.damageRolls[0].options); // "probably it"
        await workflow.setDamageRolls([damageRoll]);
    } else {
        await workflowUtils.bonusDamage(workflow, formula);
    }
}
async function late({workflow}) {
    let targets = workflow.hitTargets;
    if (!targets) return;
    let config = itemUtils.getGenericFeatureConfig(workflow.item, 'movementBonusActivity');
    // Check activities
    let activities = config.activities;
    if (activities?.length && !activities.includes(workflow.activity.id)) return;
    // Check distance
    if (tokenUtils.getLinearDistanceMoved(workflow.token) < config.distance) return;
    // Check size
    if (config.maxSize && config.maxSize != 'none' && !actorUtils.compareSize(workflow.hitTargets.first(), config.maxSize, '<=')) return;
    // Check saves
    if (config.checkSaves && !workflow.failedSaves.size) return;
    let combatant = game?.combat.combatants.find(i => i.tokenId === workflow.token.id);
    if (combatant) {
        let lastMovementId = workflow.token.document.movementHistory.at(-1).movementId;
        if (combatant.flags['chris-premades']?.movementBonusActivity?.lastMovementId === lastMovementId) return;
        else genericUtils.setFlag(combatant, 'chris-premades', 'movementBonusActivity.lastMovementId', lastMovementId);
    }
    let itemActivities = workflow.item.system.activities;
    let triggerActivities = itemActivities.filter(i => config.triggerActivities.includes(i.id));
    if (!triggerActivities.length) return;
    for (let i of triggerActivities) {
        await workflowUtils.syntheticActivityRoll(i, [workflow.hitTargets.first()]);
    }
}
function actorSizes() {
    if (!CONFIG?.DND5E?.actorSizes) return false;
    return Object.entries(CONFIG.DND5E.actorSizes).reduce((options, [key, value]) => {
        options.push({label: value.label, value: key});
        return options;
    }, [{label: 'DND5E.None', value: 'none'}]);
}
export let movementBonusActivity = {
    name: 'Movement Bonus Activity',
    translation: 'CHRISPREMADES.Macros.MovementBonusActivity.Name',
    version: '1.3.37',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: late,
                priority: 50,
            },
            {
                pass: 'damageRollComplete',
                macro: early,
                priority: 50
            }
        ]
    },
    isGenericFeature: true,
    genericConfig: [
        {
            value: 'activities',
            label: 'CHRISPREMADES.Config.Activities',
            type: 'activities',
            default: []
        },
        {
            value: 'triggerActivities',
            label: 'CHRISPREMADES.Macros.ActivityOnRest.TriggerActivities',
            type: 'activities',
            default: []
        },
        {
            value: 'checkSave',
            label: 'CHRISPREMADES.Config.CheckSave',
            type: 'checkbox',
            default: false
        },
        {
            value: 'distance',
            label: 'CHRISPREMADES.Macros.MovementBonusActivity.Distance',
            type: 'number',
            default: '20'
        },
        {
            value: 'damageBonus',
            label: 'CHRISPREMADES.Config.DamageBonus',
            type: 'text',
            default: ''
        },
        {
            value: 'replaceDamageFormula',
            label: 'CHRISPREMADES.Macros.MovementBonusActivity.ReplaceDamageFormula',
            type: 'checkbox',
            default: false
        },
        {
            value: 'maxSize',
            label: 'CHRISPREMADES.Config.MaxSize',
            type: 'select',
            default: false,
            options: actorSizes
        }
    ]
};