import {actorUtils, compendiumUtils, constants, dialogUtils, effectUtils, errors, genericUtils, itemUtils, rollUtils, socketUtils} from '../../utils.js';
async function use({trigger, workflow}) {
    if (!workflow.token || workflow.targets.size != 1) return;
    let targetToken = workflow.targets.first();
    if (actorUtils.checkTrait(targetToken.actor, 'ci', 'grappled')) {
        genericUtils.notify('CHRISPREMADES.Macros.Grapple.Immune', 'info');
        return;
    }
    if (actorUtils.getSize(targetToken.actor) > (actorUtils.getSize(workflow.actor) + 1)) {
        genericUtils.notify('CHRISPREMADES.Macros.Grapple.Size', 'info');
        return;
    }
    let inputs = [[CONFIG.DND5E.skills.ath.label, 'ath'], [CONFIG.DND5E.skills.acr.label, 'acr'], ['CHRISPREMADES.Generic.Uncontested', 'skip']];
    let targetUser = socketUtils.firstOwner(targetToken);
    let selection = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Macros.Grapple.ChooseSkill', inputs, {displayAsRows: true, userId: targetUser.id});
    if (!selection) return;
    if (selection != 'skip') {
        let result = await rollUtils.contestedRoll({
            sourceToken: workflow.token, 
            targetToken, 
            sourceRollType: 'skill', 
            targetRollType: 'skill', 
            sourceAbilities: ['ath'], 
            targetAbilities: [selection]
        });
        if (result <= 0) return;
    }
    //Rideable integration here!
    let sourceEffectData = {
        name: genericUtils.format('CHRISPREMADES.Macros.Actions.Grappling', {tokenName: targetToken.name}),
        img: workflow.item.img,
        origin: workflow.actor.uuid,
        flags: {
            dae: {
                showIcon: true
            },
            'chris-premades': {
                grapple: {
                    tokenId: targetToken.id
                }
            }
        }
    };
    let targetEffectData = {
        name: genericUtils.format('CHRISPREMADES.Macros.Actions.GrappledBy', {tokenName: workflow.token.name}),
        img: workflow.item.img,
        origin: workflow.actor.uuid,
        flags: {
            dae: {
                showIcon: true
            },
            'chris-premades': {
                conditions: ['grappled']
            }
        }
    };
    let grappler = itemUtils.getItemByIdentifier(workflow.actor, 'grappler');
    let featureData;
    if (grappler && !itemUtils.getItemByIdentifier(workflow.actor, 'grapplerPin')) {
        featureData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.featFeatures, 'Grappler: Pin', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.Grappler.Pin', identifier: 'grapplerPin'});
        if (!featureData) {
            errors.missingPackItem();
            return;
        }
    }
    let sourceOptions = {identifier: 'grappling'};
    if (grappler) sourceOptions.vae = [{type: 'use', name: featureData.name, identifier: 'grapplerPin'}];
    let sourceEffect = await effectUtils.createEffect(workflow.actor, sourceEffectData, sourceOptions);
    if (grappler) await itemUtils.createItems(workflow.actor, [featureData], {favorite: true, parentEntity: sourceEffect});
    let targetEffect = await effectUtils.createEffect(targetToken.actor, targetEffectData, {parentEntity: sourceEffect, strictlyInterdependent: true});
    let grappledEffect = effectUtils.getEffectByStatusID(targetToken.actor, 'grappled');
    let timePassed = 0;
    while (!grappledEffect && timePassed < 1000) {
        await genericUtils.sleep(100);
        grappledEffect = effectUtils.getEffectByStatusID(targetToken.actor, 'grappled');
        timePassed += 100;
    }
    if (grappledEffect) await effectUtils.addDependent(grappledEffect, [targetEffect]);
}
export let grapple = {
    name: 'Grapple',
    version: '0.12.12',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    }
};