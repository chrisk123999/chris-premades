import {constants, dialogUtils, effectUtils, genericUtils, rollUtils, socketUtils} from '../../../utils.js';
async function early({trigger: {entity: item}, workflow}) {
    if (!constants.attacks.includes(workflow.activity.actionType)) return;
    if (!workflow.targets.size) return;
    let grapplingEffects = effectUtils.getAllEffectsByIdentifier(workflow.actor, 'grappling');
    if (!grapplingEffects.length) return;
    if (!grapplingEffects.some(i => i.flags['chris-premades'].grapple.tokenId === workflow.targets.first()?.id)) return;
    workflow.advantage = true;
    workflow.attackAdvAttribution.add(genericUtils.translate('DND5E.Advantage') + ': ' + item.name);
}
async function use({workflow}) {
    if (!workflow.token || workflow.targets.size !== 1) return;
    let targetToken = workflow.targets.first();
    let grapplingEffects = effectUtils.getAllEffectsByIdentifier(workflow.actor, 'grappling');
    if (!grapplingEffects.length) return;
    let grapplingEffect = grapplingEffects.find(i => i.flags['chris-premades'].grapple.tokenId === targetToken.id);
    if (!grapplingEffect) return;
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
    let effectData = {
        name: genericUtils.format('CHRISPREMADES.Macros.Grappler.Pinning', {tokenName: targetToken.name}),
        img: workflow.item.img,
        origin: workflow.item.uuid,
        flags: {
            dae: {
                showIcon: true
            },
            'chris-premades': {
                conditions: ['restrained']
            }
        }
    };
    let sourceEffect = await effectUtils.createEffect(workflow.actor, effectData, {parentEntity: grapplingEffect, strictlyInterdependent: true});
    effectData.name = genericUtils.format('CHRISPREMADES.Macros.Grappler.Pinned', {tokenName: workflow.token.name});
    await effectUtils.createEffect(targetToken.actor, effectData, {parentEntity: sourceEffect, strictlyInterdependent: true});
}
export let grappler = {
    name: 'Grappler',
    version: '1.1.0',
    midi: {
        actor: [
            {
                pass: 'preambleComplete',
                macro: early,
                priority: 50
            }
        ]
    },
    ddbi: {
        removedItems: {
            'Grappler': [
                'Grappling Pin'
            ]
        }
    }
};
export let grapplerPin = {
    name: 'Grappler: Pin',
    version: grappler.version,
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