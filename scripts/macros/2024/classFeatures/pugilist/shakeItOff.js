import {activityUtils, constants, dialogUtils, effectUtils, genericUtils, itemUtils, workflowUtils} from '../../../../utils.js';
import {digDeep} from './digDeep.js';

async function use({trigger: {entity: item, token}}) {
    if (!item.system.uses.value) return;
    let conditions = itemUtils.getConfig(item, 'conditions');
    let hasConditions = conditions.map(i => effectUtils.getEffectByStatusID(token.actor, i)).filter(i => i);
    let digging = effectUtils.getEffectByIdentifier(item.parent, 'diggingDeep');
    let exhaustion = digging?.flags['chris-premades']?.exhaustion ?? item.parent.system.attributes.exhaustion ?? 0;
    if (digging && exhaustion) {
        digging.name = genericUtils.translate('DND5E.Exhaustion');
        hasConditions.push(digging);
    }
    if (!hasConditions.length) return;
    let selection = await dialogUtils.selectDocumentDialog(item.name, 'CHRISPREMADES.Generic.SelectRemoveCondition', hasConditions, {sortAlphabetical: true});
    if (!selection) return;
    exhaustion--;
    let use = activityUtils.getActivityByIdentifier(item, 'use');
    await workflowUtils.completeActivityUse(use);
    if (selection.id === digging?.id) {
        let img = exhaustion <= 0 ? 
            itemUtils.getItemByIdentifier(token.actor, 'digDeep')?.img ?? '' :
            `systems/dnd5e/icons/svg/statuses/exhaustion-${exhaustion}.svg`;
        await genericUtils.update(digging, {flags: {'chris-premades': {exhaustion}}, img});
    } else if (selection.id === CONFIG.statusEffects.find(s => s.id === 'exhaustion')?._id ?? 'dnd5eexhaustion0') {
        await genericUtils.update(token.actor, {'system.attributes.exhaustion': exhaustion});
    } else {
        await genericUtils.remove(selection);
    }
}
export let shakeItOff = {
    name: 'Shake It Off',
    version: '1.4.25',
    rules: 'modern',
    combat: [
        {
            pass: 'turnStart',
            macro: use,
            priority: 50
        }
    ],
    midi: digDeep.midi,
    config: [
        {
            value: 'conditions',
            label: 'CHRISPREMADES.Config.Conditions',
            type: 'select-many',
            default: ['blinded', 'charmed', 'deafened', 'exhaustion', 'frightened', 'paralyzed', 'poisoned', 'restrained', 'stunned'],
            options: constants.statusOptions,
            category: 'homebrew',
            homebrew: true
        }
    ]
};
