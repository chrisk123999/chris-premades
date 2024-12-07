import {actorUtils, compendiumUtils, constants, dialogUtils, effectUtils, errors, genericUtils, itemUtils, rollUtils, socketUtils} from '../../utils.js';
export async function grappleHelper(sourceToken, targetToken, item, {noContest = false, flatDC = false, escapeDisadvantage = false}={}) {
    let sourceActor = sourceToken.actor;
    if (actorUtils.checkTrait(targetToken.actor, 'ci', 'grappled')) {
        genericUtils.notify('CHRISPREMADES.Macros.Grapple.Immune', 'info');
        return;
    }
    if (actorUtils.getSize(targetToken.actor) > (actorUtils.getSize(sourceActor) + 1)) {
        genericUtils.notify('CHRISPREMADES.Macros.Grapple.Size', 'info');
        return;
    }
    if (!noContest) {
        let inputs = [[CONFIG.DND5E.skills.ath.label, 'ath'], [CONFIG.DND5E.skills.acr.label, 'acr'], ['CHRISPREMADES.Generic.Uncontested', 'skip']];
        let targetUser = socketUtils.firstOwner(targetToken);
        let selection = await dialogUtils.buttonDialog(item.name, 'CHRISPREMADES.Macros.Grapple.ChooseSkill', inputs, {displayAsRows: true, userId: targetUser.id});
        if (!selection) return;
        // TODO: more generic version of this? Does it come up elsewhere?
        let sourceRollOptions, targetRollOptions;
        if (itemUtils.getItemByIdentifier(sourceActor, 'amorphous')) {
            sourceRollOptions = {
                advantage: true
            };
        }
        if (selection != 'skip') {
            let result = await rollUtils.contestedRoll({
                sourceToken, 
                targetToken, 
                sourceRollType: 'skill', 
                targetRollType: 'skill', 
                sourceAbilities: ['ath'], 
                targetAbilities: [selection],
                sourceRollOptions,
                targetRollOptions
            });
            if (result <= 0) return;
        }
    }
    let sourceEffectData = {
        name: genericUtils.format('CHRISPREMADES.Macros.Actions.Grappling', {tokenName: targetToken.name}),
        img: item.img,
        origin: sourceActor.uuid,
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
    let targetEffectName = genericUtils.format('CHRISPREMADES.Macros.Actions.GrappledBy', {tokenName: sourceToken.name});
    let targetEffectData = {
        name: targetEffectName,
        img: 'icons/environment/traps/net.webp',
        origin: sourceActor.uuid,
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
                    tokenId: sourceToken.id
                }
            }
        }
    };
    effectUtils.addMacro(sourceEffectData, 'death', ['grapple']);
    effectUtils.addMacro(targetEffectData, 'death', ['grapple']);
    let grappler = itemUtils.getItemByIdentifier(sourceActor, 'grappler');
    let pinData;
    if (grappler && !itemUtils.getItemByIdentifier(sourceActor, 'grapplerPin')) {
        pinData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.featFeatures, 'Grappler: Pin', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.Grappler.Pin', identifier: 'grapplerPin'});
        if (!pinData) {
            errors.missingPackItem();
            return;
        }
    }
    let escapeData = await compendiumUtils.getItemFromCompendium(constants.packs.miscellaneousItems, 'Grapple: Escape', {object: true, translate: 'CHRISPREMADES.Macros.Actions.GrappleEscape', identifier: 'grappleEscape'});
    if (!escapeData) return;
    if (flatDC || escapeDisadvantage) {
        genericUtils.setProperty(escapeData, 'flags.chris-premades.grapple.' + sourceToken.id, {
            dc: flatDC,
            disadvantage: escapeDisadvantage
        });
    }
    let sourceOptions = {identifier: 'grappling'};
    if (grappler) sourceOptions.vae = [{type: 'use', name: pinData.name, identifier: 'grapplerPin'}];
    let sourceEffect = await effectUtils.createEffect(sourceActor, sourceEffectData, sourceOptions);
    if (grappler) await itemUtils.createItems(sourceActor, [pinData], {favorite: true, parentEntity: sourceEffect});
    let targetEffect = await effectUtils.createEffect(targetToken.actor, targetEffectData, {identifier: 'grappled', parentEntity: sourceEffect, strictlyInterdependent: true, vae: [{type: 'use', name: escapeData.name, identifier: 'grappleEscape'}]});
    let escapeItem = itemUtils.getItemByIdentifier(targetToken.actor, 'grappleEscape');
    if (!escapeItem) {
        await itemUtils.createItems(targetToken.actor, [escapeData], {favorite: true, parentEntity: targetEffect});
    } else {
        await genericUtils.update(escapeItem, {
            flags: {
                'chris-premades': {
                    grapple: {
                        [sourceToken.id]: {
                            dc: flatDC,
                            disadvantage: escapeDisadvantage
                        }
                    }
                }
            }
        });
    }
    let grappledEffect = effectUtils.getEffectByStatusID(targetToken.actor, 'grappled');
    let timePassed = 0;
    while (!grappledEffect && timePassed < 1000) {
        await genericUtils.sleep(100);
        grappledEffect = effectUtils.getEffectByStatusID(targetToken.actor, 'grappled');
        timePassed += 100;
    }
    if (grappledEffect) await effectUtils.addDependent(grappledEffect, [targetEffect]);
    if (game.modules.get('Rideable')?.active) game.Rideable.Mount([targetToken.document], sourceToken.document, {'Grappled': true, 'MountingEffectsOverride': ['Grappled']});
}
async function use({trigger, workflow}) {
    if (!workflow.token || workflow.targets.size != 1) return;
    let targetToken = workflow.targets.first();
    await grappleHelper(workflow.token, targetToken, workflow.item);
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
        let escapeData = await compendiumUtils.getItemFromCompendium(constants.packs.miscellaneous, 'Grapple: Escape', {object: true, translate: 'CHRISPREMADES.Macros.Actions.GrappleEscape', identifier: 'grappleEscape'});
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