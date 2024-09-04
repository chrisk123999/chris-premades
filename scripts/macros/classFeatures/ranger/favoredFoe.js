import {combatUtils, constants, dialogUtils, effectUtils, genericUtils, itemUtils, workflowUtils} from '../../../utils.js';

async function use({workflow}) {
    if (!workflow.targets.size) return;
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: itemUtils.convertDuration(workflow.item)
    };
    effectUtils.addMacro(effectData, 'midi.actor', ['favoredFoeActive']);
    let effect = await effectUtils.createEffect(workflow.actor, effectData, {concentrationItem: workflow.item, interdependent: true, identifier: 'favoredFoe'});
    delete effectData.flags;
    await effectUtils.createEffect(workflow.targets.first().actor, effectData, {parentEntity: effect, identifier: 'favoredFoe', strictlyInterdependent: true});
}
async function damage({workflow}) {
    if (workflow.hitTargets.size !== 1) return;
    if (!constants.attacks.includes(workflow.item.system.actionType)) return;
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'favoredFoe');
    let originItem = itemUtils.getItemByIdentifier(workflow.actor, 'favoredFoe');
    if (!originItem) return;
    let classLevel = workflow.actor.classes?.ranger?.system?.levels;
    if (!classLevel) return;
    let numFaces = 4 + 2 * Math.floor((classLevel + 2) / 8);
    let bonusDamageFormula = '1d' + numFaces + '[' + workflow.defaultDamageType + ']';
    let targetToken = workflow.targets.first();
    if (!effect) {
        if (!originItem.system.uses.value) return;
        let selection = await dialogUtils.confirm(originItem.name, genericUtils.format('CHRISPREMADES.Dialog.Use', {itemName: originItem.name}));
        if (!selection) return;
        await workflowUtils.syntheticItemRoll(originItem, [targetToken], {options: {configureDialog: true}, config: {consumeUsage: true}});
    } else {
        if (!combatUtils.perTurnCheck(effect, 'favoredFoe', true, workflow.token.id)) return;
        let targetEffects = effectUtils.getAllEffectsByIdentifier(targetToken.actor, 'favoredFoe');
        if (!targetEffects.some(i => i.origin === originItem.uuid)) return;
    }
    await workflowUtils.bonusDamage(workflow, bonusDamageFormula, {damageType: workflow.defaultDamageType});
    await combatUtils.setTurnCheck(effect, 'favoredFoe');
}
export let favoredFoe = {
    name: 'Favored Foe',
    version: '0.12.53',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ],
        actor: [
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 50
            }
        ]
    }
};