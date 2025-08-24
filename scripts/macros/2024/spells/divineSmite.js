import {activityUtils, actorUtils, combatUtils, constants, dialogUtils, effectUtils, genericUtils, itemUtils, rollUtils, workflowUtils} from '../../../utils.js';
async function hit({trigger, workflow}) {
    if (!workflow.hitTargets.size || workflow.activity.actionType != 'mwak' || actorUtils.hasUsedBonusAction(workflow.actor)) return;
    if (combatUtils.inCombat()) if (combatUtils.getCurrentCombatantToken() != workflow.token) return;
    let identifiers = [
        'divineSmite',
        'searingSmite',
        'thunderousSmite',
        'wrathfulSmite',
        'shiningSmite',
        'blindingSmite',
        'staggeringSmite',
        'banishingSmite'
    ];
    let spells = actorUtils.getCastableSpells(workflow.actor).filter(i => identifiers.includes(genericUtils.getIdentifier(i))).sort((a, b) => a.system.level - b.system.level);
    if (!spells.length) return;
    let selection = await dialogUtils.selectDocumentDialog(workflow.item.name, 'CHRISPREMADES.Macros.DivineSmite.Context', spells, {addNoneDocument: true});
    if (!selection) return;
    let target = workflow.targets.first();
    let spellWorkflow = await workflowUtils.completeItemUse(selection, undefined, {targetUuids: [target.document.uuid]});
    if (!spellWorkflow) return;
    let identifier = genericUtils.getIdentifier(selection);
    let damageType = itemUtils.getConfig(selection, 'damageType');
    let diceSize = itemUtils.getConfig(selection, 'diceSize');
    let diceNumber = itemUtils.getConfig(selection, 'baseDiceNumber');
    if (identifier === 'divineSmite') {
        let creatureTypes = itemUtils.getConfig(selection, 'creatureTypes');
        if (creatureTypes.includes(actorUtils.typeOrRace(target.actor))) diceNumber += 1;
    } else if (identifier === 'banishingSmite') {
        let effectData = {
            name: selection.name,
            img: selection.img,
            duration: {
                seconds: 1
            },
            origin: selection.uuid,
            flags: {
                'chris-premades': {
                    banishingSmite: {
                        workflowId: workflow.id
                    }
                }
            }
        };
        await effectUtils.createEffect(workflow.actor, effectData, {identifier: 'banishingSmiteEffect', animate: false});
    }
    let formula = ((workflowUtils.getCastLevel(spellWorkflow) - spellWorkflow.castData.baseLevel) + diceNumber) + diceSize;
    if (workflow.actor.system.bonuses.spell?.all?.damage) formula += ' + @bonuses.spell.all.damage';
    await workflowUtils.bonusDamage(workflow, formula, {damageType});
}
async function complete({trigger, workflow}) {
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'banishingSmiteEffect');
    if (!effect) return;
    let workflowId = effect.flags['chris-premades']?.banishingSmite?.workflowId;
    if (!workflowId) return;
    if (workflow.id != workflowId) return;
    let item = await effectUtils.getOriginItem(effect);
    if (!item) return;
    let requiredHP = itemUtils.getConfig(item, 'hp');
    await genericUtils.remove(effect);
    if (workflow.targets.first().actor.system.attributes.hp.value > requiredHP) return;
    let activity = activityUtils.getActivityByIdentifier(item, 'banish', {strict: true});
    if (!activity) return;
    await workflowUtils.syntheticActivityRoll(activity, [workflow.targets.first()]);
}
export let divineSmite = {
    name: 'Divine Smite',
    version: '1.1.14',
    rules: 'modern',
    midi: {
        actor: [
            {
                pass: 'damageRollComplete',
                macro: hit,
                priority: 200,
                unique: 'divineSmite'
            },
            {
                pass: 'rollFinished',
                macro: complete,
                priority: 200,
                unique: 'divineSmiteComplete'
            }
        ]
    },
    config: [
        {
            value: 'creatureTypes',
            label: 'CHRISPREMADES.Macros.DivineSmite.CreatureTypes',
            type: 'select-many',
            default: ['undead', 'fiend'],
            options: constants.creatureTypeOptions,
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'damageType',
            label: 'CHRISPREMADES.Config.DamageType',
            type: 'select',
            default: 'radiant',
            category: 'homebrew',
            homebrew: true,
            options: constants.damageTypeOptions
        },
        {
            value: 'diceSize',
            label: 'CHRISPREMADES.Config.DiceSize',
            type: 'select',
            default: 'd8',
            options: constants.diceSizeOptions,
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'baseDiceNumber',
            label: 'CHRISPREMADES.Config.BaseDiceNumber',
            type: 'number',
            default: 2,
            category: 'homebrew',
            homebrew: true
        }
    ]
};