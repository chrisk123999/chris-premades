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
    let targetEffectName = genericUtils.format('CHRISPREMADES.Macros.Actions.GrappledBy', {tokenName: workflow.token.name});
    let targetEffectData = {
        name: targetEffectName,
        img: 'icons/environment/traps/net.webp',
        origin: workflow.actor.uuid,
        changes: [
            {
                key: 'flags.Rideable.RegisteredActorEffectsFlag.grapple',
                mode: 2,
                value: targetEffectName,
                priority: 20
            }
        ],
        flags: {
            dae: {
                showIcon: true
            },
            'chris-premades': {
                conditions: ['grappled'],
                grapple: {
                    tokenId: workflow.token.id
                }
            }
        }
    };
    let grappler = itemUtils.getItemByIdentifier(workflow.actor, 'grappler');
    let pinData;
    if (grappler && !itemUtils.getItemByIdentifier(workflow.actor, 'grapplerPin')) {
        pinData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.featFeatures, 'Grappler: Pin', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.Grappler.Pin', identifier: 'grapplerPin'});
        if (!pinData) {
            errors.missingPackItem();
            return;
        }
    }
    let escapeData = await compendiumUtils.getItemFromCompendium(constants.packs.miscellaneousItems, 'Grapple: Escape', {object: true, translate: 'CHRISPREMADES.Macros.Actions.GrappleEscape', identifier: 'grappleEscape'});
    if (!escapeData) return;
    let sourceOptions = {identifier: 'grappling'};
    if (grappler) sourceOptions.vae = [{type: 'use', name: pinData.name, identifier: 'grapplerPin'}];
    let sourceEffect = await effectUtils.createEffect(workflow.actor, sourceEffectData, sourceOptions);
    if (grappler) await itemUtils.createItems(workflow.actor, [pinData], {favorite: true, parentEntity: sourceEffect});
    let targetEffect = await effectUtils.createEffect(targetToken.actor, targetEffectData, {identifier: 'grappled', parentEntity: sourceEffect, strictlyInterdependent: true, vae: [{type: 'use', name: escapeData.name, identifier: 'grappleEscape'}]});
    if (!itemUtils.getItemByIdentifier(targetToken.actor, 'grappleEscape')) await itemUtils.createItems(targetToken.actor, [escapeData], {favorite: true, parentEntity: targetEffect});
    let grappledEffect = effectUtils.getEffectByStatusID(targetToken.actor, 'grappled');
    let timePassed = 0;
    while (!grappledEffect && timePassed < 1000) {
        await genericUtils.sleep(100);
        grappledEffect = effectUtils.getEffectByStatusID(targetToken.actor, 'grappled');
        timePassed += 100;
    }
    if (grappledEffect) await effectUtils.addDependent(grappledEffect, [targetEffect]);
    if (game.modules.get('Rideable')?.active) game.Rideable.Mount([targetToken.document], workflow.token.document, {'Grappled': true, 'MountingEffectsOverride': ['Grappled']});

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
    let inputs = [[CONFIG.DND5E.skills.ath.label, 'ath'], [CONFIG.DND5E.skills.acr.label, 'acr']];
    let selection = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Macros.Grapple.ChooseSkillEscape', inputs, {displayAsRows: true});
    if (!selection) return;
    let result = await rollUtils.contestedRoll({
        sourceToken: workflow.token, 
        targetToken, 
        sourceRollType: 'skill', 
        targetRollType: 'skill', 
        sourceAbilities: [selection], 
        targetAbilities: ['ath']
    });
    if (result <= 0) return;
    let effect = grappledEffects.find(i => i.flags['chris-premades'].grapple.tokenId === targetToken.id);
    if (effect) await genericUtils.remove(effect);
    let remainingGrappledEffects = grappledEffects.filter(i => i.id !== effect.id);
    if (remainingGrappledEffects.length) {
        let escapeData = await compendiumUtils.getItemFromCompendium(constants.packs.miscellaneous, 'Grapple: Escape', {object: true, translate: 'CHRISPREMADES.Macros.Actions.GrappleEscape', identifier: 'grappleEscape'});
        if (!escapeData) return;
        await itemUtils.createItems(targetToken.actor, [escapeData], {favorite: true, parentEntity: remainingGrappledEffects[0]});
    }
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