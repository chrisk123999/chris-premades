import {actorUtils, constants, dialogUtils, genericUtils, itemUtils, rollUtils, socketUtils, tokenUtils, workflowUtils} from '../../../../utils.js';
async function allyBonus({trigger: {entity: item, roll, sourceActor}}) {
    let targetValue = roll.options.target;
    if (targetValue && (roll.total >= targetValue)) return;
    let source = roll.data.token ?? actorUtils.getFirstToken(sourceActor);
    if (!source) return;
    let range = itemUtils.getActivity(item, 'utility')?.range.value || 30;
    let nearbyTokens = tokenUtils.findNearby(source, range, 'ally').filter(t => {
        if (actorUtils.hasUsedReaction(t.actor)) return;
        let feature = itemUtils.getItemByIdentifier(t.actor, 'flashOfGenius');
        if (!feature?.system.uses.value) return;
        genericUtils.setProperty(t, 'chris-premades.flashOfGenius', feature);
        return true;
    });
    if (!nearbyTokens.length) return;
    for (let t of nearbyTokens) {
        let feature = genericUtils.getProperty(t, 'chris-premades.flashOfGenius');
        let ability = itemUtils.getConfig(feature, 'ability') || 'int';
        let formula = Math.max(1, t.actor.system.abilities[ability].mod);
        let userId = socketUtils.firstOwner(t.actor, true);
        let selection = await dialogUtils.confirm(feature.name, genericUtils.format('CHRISPREMADES.Dialog.UseRollTotal', {itemName: feature.name + ' (+' + formula + ')', rollTotal: roll.total}), {userId});
        if (!selection) continue;
        await workflowUtils.syntheticItemRoll(feature, [source], {consumeUsage: true, consumeResources: true, userId});
        roll = await rollUtils.addToRoll(roll, formula);
        await actorUtils.setReactionUsed(t.actor);
    }
    return roll;
}
async function selfBonus({trigger: {entity: item, roll}}) {
    let targetValue = roll.options.target;
    if (targetValue && (roll.total >= targetValue)) return;
    if (!item.system.uses.value) return;
    if (actorUtils.hasUsedReaction(item.parent)) return;
    let ability = itemUtils.getConfig(item, 'ability') || 'int';
    let formula = Math.max(1, item.parent.system.abilities[ability].mod);
    let selection = await dialogUtils.confirm(item.name, genericUtils.format('CHRISPREMADES.Dialog.UseRollTotal', {itemName: item.name + ' (+' + formula + ')', rollTotal: roll.total}));
    if (!selection) return;
    let self = roll.data.token ?? actorUtils.getFirstToken(item.parent);
    await workflowUtils.syntheticItemRoll(item, [self], {consumeUsage: true, consumeResources: true});
    return await rollUtils.addToRoll(roll, formula);
}
export let flashOfGenius = {
    name: 'Flash of Genius',
    version: '1.5.17',
    rules: 'modern',
    check: [
        {
            pass: 'bonus',
            macro: selfBonus,
            priority: 100
        },
        {
            pass: 'sceneBonus',
            macro: allyBonus,
            priority: 100
        }
    ],
    save: [
        {
            pass: 'bonus',
            macro: selfBonus,
            priority: 100
        },
        {
            pass: 'sceneBonus',
            macro: allyBonus,
            priority: 100
        }
    ],
    skill: [
        {
            pass: 'bonus',
            macro: selfBonus,
            priority: 100
        },
        {
            pass: 'sceneBonus',
            macro: allyBonus,
            priority: 100
        }
    ],
    config: [
        {
            value: 'ability',
            label: 'CHRISPREMADES.Config.Ability',
            type: 'select',
            default: 'int',
            options: constants.abilityOptions,
            category: 'homebrew',
            homebrew: true
        }
    ]
};
