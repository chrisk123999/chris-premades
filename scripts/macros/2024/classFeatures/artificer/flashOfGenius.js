import {actorUtils, constants, dialogUtils, genericUtils, itemUtils, rollUtils, socketUtils, tokenUtils, workflowUtils} from '../../../../utils.js';
async function allyBonus({trigger: {entity: item, roll, sourceActor, token}}) {
    let targetValue = roll.options.target;
    if (targetValue && (roll.total >= targetValue)) return;
    if (!item.system.uses.value) return;
    if (actorUtils.hasUsedReaction(item.parent)) return;
    let self = token ?? actorUtils.getFirstToken(item.parent);
    let source = roll.data.token ?? actorUtils.getFirstToken(sourceActor);
    if (!self || !source) return;
    if (self.document.disposition !== source.document.disposition) return;
    let range = itemUtils.getActivity(item, 'utility')?.range.value || 30;
    if (tokenUtils.getDistance(self, source) > range) return;
    let ability = itemUtils.getConfig(item, 'ability') || 'int';
    let formula = Math.max(1, item.parent.system.abilities[ability].mod);
    let userId = socketUtils.firstOwner(item.parent, true);
    let selection = await dialogUtils.confirm(item.name, genericUtils.format('CHRISPREMADES.Dialog.UseRollTotal', {itemName: item.name + ' (+' + formula + ')', rollTotal: roll.total}), {userId});
    if (!selection) return;
    await workflowUtils.syntheticItemRoll(item, [source], {consumeUsage: true, consumeResources: true, userId});
    return await rollUtils.addToRoll(roll, formula);
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
