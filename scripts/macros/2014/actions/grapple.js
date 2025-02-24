import {compendiumUtils, constants, dialogUtils, effectUtils, genericUtils, itemUtils, rollUtils, tokenUtils} from '../../../utils.js';

async function use({trigger, workflow}) {
    if (!workflow.token || workflow.targets.size != 1) return;
    let targetToken = workflow.targets.first();
    await tokenUtils.grappleHelper(workflow.token, targetToken, workflow.item);
}
async function escape({workflow}) {
    let grappledEffects = effectUtils.getAllEffectsByIdentifier(workflow.token.actor, 'grappled');
    let potentialTargets = grappledEffects.map(i => workflow.token.scene.tokens.get(i.flags['chris-premades'].grapple.tokenId)?.object).filter(i => i);
    if (!potentialTargets.length) return;
    let targetToken;
    if (potentialTargets.length > 1) {
        let selected = await dialogUtils.selectTargetDialog(workflow.item.name, 'CHRISPREMADES.Macros.Actions.GrappleEscapeSelect', potentialTargets);
        if (!selected?.length) return;
        targetToken = selected[0];
    }
    if (!targetToken) targetToken = potentialTargets[0];
    let escapeFlags = genericUtils.getProperty(workflow.item, 'flags.chris-premades.grapple.' + targetToken.id);
    let inputs = [[CONFIG.DND5E.skills.ath.label, 'ath'], [CONFIG.DND5E.skills.acr.label, 'acr']];
    let selection = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Macros.Grapple.ChooseSkillEscape', inputs, {displayAsRows: true});
    if (!selection) return;
    let sourceRollOptions = {};
    let targetRollOptions = {};
    if (itemUtils.getItemByIdentifier(workflow.actor, 'amorphous')) {
        sourceRollOptions = {
            advantage: true
        };
    }
    
    if (escapeFlags?.disadvantage) sourceRollOptions.disadvantage = true;
    if (!escapeFlags?.dc) {
        // TODO: more generic version of this? Does it come up elsewhere?
        let result = await rollUtils.contestedRoll({
            sourceToken: workflow.token, 
            targetToken, 
            sourceRollType: 'skill', 
            targetRollType: 'skill', 
            sourceAbilities: [selection], 
            targetAbilities: ['ath'],
            sourceRollOptions,
            targetRollOptions
        });
        if (result <= 0) return;
    } else {
        let result = await rollUtils.requestRoll(workflow.token, 'skill', selection, sourceRollOptions);
        if (result.total <= escapeFlags?.dc) return;
    }
    let effect = grappledEffects.find(i => i.flags['chris-premades'].grapple.tokenId === targetToken.id);
    if (effect) await genericUtils.remove(effect);
    let remainingGrappledEffects = grappledEffects.filter(i => i.id !== effect.id);
    if (remainingGrappledEffects.length) {
        let escapeData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.miscellaneousItems, 'Grapple: Escape', {object: true, translate: 'CHRISPREMADES.Macros.Actions.GrappleEscape', identifier: 'grappleEscape'});
        if (!escapeData) return;
        await itemUtils.createItems(targetToken.actor, [escapeData], {favorite: true, parentEntity: remainingGrappledEffects[0]});
    }
}
async function remove({trigger}) {
    await genericUtils.remove(trigger.entity);
}
export let grapple = {
    name: 'Grapple',
    version: '1.1.0',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    },
    death: [
        {
            pass: 'dead',
            macro: remove,
            priority: 50
        }
    ]
};
export let grappleEscape = {
    name: 'Grapple: Escape',
    version: grapple,
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: escape,
                priority: 50
            }
        ]
    }
};