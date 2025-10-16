import {activityUtils, actorUtils, combatUtils, dialogUtils, effectUtils, spellUtils, workflowUtils} from '../../../../../utils.js';
async function use({trigger, workflow}) {
    if (!workflow.targets.size) return;
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'findFamiliar');
    if (!effect) return;
    let familiarToken = canvas.scene.tokens.get(effect.flags['chris-premades'].summons.ids[effect.name][0]);
    if (!familiarToken) return;
    if (actorUtils.hasUsedReaction(familiarToken.actor)) return;
    let attacks = familiarToken.actor.items.filter(item => item.hasAttack);
    if (!attacks.length) return;
    let selection;
    if (attacks.length == 1) {
        selection = attacks[0];
    } else {
        selection = await dialogUtils.selectDocumentDialog(workflow.item.name, 'CHRISPREMADES.Macros.PactOfTheChain.Attack', attacks, {sortAlphabetical: true});
        if (!selection) return;
    }
    await workflowUtils.specialItemUse(selection, Array.from(workflow.targets), workflow.item, {consumeResources: true, consumeUsage: true});
    if (combatUtils.inCombat()) await actorUtils.setReactionUsed(familiarToken.actor);
}
async function added({trigger: {entity: item}}) {
    let activity = activityUtils.getActivityByIdentifier(item, 'findFamiliar', {strict: true});
    if (!activity) return;
    let findFamiliar = await spellUtils.getCompendiumSpell('findFamiliar', {identifier: true, rules: 'modern'});
    if (!findFamiliar) return;
    await activityUtils.correctSpellLink(activity, findFamiliar);
}
export let pactOfTheChain = {
    name: 'Eldritch Invocations: Pact of the Chain',
    version: '1.3.105',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    },
    item: [
        {
            pass: 'created',
            macro: added,
            priority: 50
        },
        {
            pass: 'itemMedkit',
            macro: added,
            priority: 50
        },
        {
            pass: 'actorMunch',
            macro: added,
            priority: 50
        }
    ]
};