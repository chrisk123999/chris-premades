import {actorUtils, crosshairUtils, dialogUtils, effectUtils, genericUtils, itemUtils, socketUtils, tokenUtils, workflowUtils} from '../../../../utils.js';

async function late({trigger: {entity: item, token}, workflow}) {
    if (actorUtils.hasUsedReaction(token.actor)) return;
    let bloodMaledict = itemUtils.getItemByIdentifier(workflow.actor, 'bloodMaledict');
    if (!bloodMaledict?.system.uses.value) {
        genericUtils.notify('CHRISPREMADES.Generic.NoMoreResource', 'info');
    }
    let userId = socketUtils.firstOwner(token.actor, true);
    let newlyDeadList = workflow.damageList?.filter(i => i.newHP === 0 && i.oldHP > 0);
    let possibleTokens = newlyDeadList?.map(i => token.scene.tokens.get(i.tokenId)?.object)?.filter(j => j);
    if (!possibleTokens?.length) return;
    let targetToken = await dialogUtils.selectTargetDialog(item.name, genericUtils.format('CHRISPREMADES.Dialog.Use', {itemName: item.name}), possibleTokens, {skipDeadAndUnconscious: false, userId});
    if (!targetToken?.length) return;
    targetToken = targetToken[0];
    await workflowUtils.completeItemUse(item, {consumeResource: true}, {configureDialog: false});
    let amplify = await dialogUtils.confirm(item.name, 'CHRISPREMADES.Macros.BloodCurses.Amplify', {userId});
    if (amplify) {
        let damageDice = token.actor.system.scale?.['blood-hunter']?.['crimson-rite'];
        if (!damageDice) {
            genericUtils.notify(genericUtils.format('CHRISPREMADES.Generic.MissingScale', {scaleName: 'crimson-rite'}), 'warn');
            return;
        }
        let damageRoll = await new CONFIG.Dice.DamageRoll(damageDice + '[necrotic]', {}, {type: 'necrotic'}).evaluate();
        damageRoll.toMessage({
            rollMode: 'roll',
            speaker: ChatMessage.implementation.getSpeaker({token}),
            flavor: item.name
        });
        await workflowUtils.applyDamage([token], damageRoll.total, 'none');
        let modifier = itemUtils.getMod(item);
        let effectData = {
            name: item.name,
            img: item.img,
            origin: item.uuid,
            duration: itemUtils.convertDuration(item),
            changes: [
                {
                    key: 'system.bonuses.All-Attacks',
                    mode: 2,
                    value: modifier,
                    priority: 20
                }
            ],
            flags: {
                dae: {
                    showIcon: true,
                    specialDuration: ['1Attack']
                }
            }
        };
        await effectUtils.createEffect(targetToken.actor, effectData);
        let position = await crosshairUtils.aimCrosshair({
            token,
            maxRange: Math.floor(targetToken.actor.system.attributes.movement.walk / 2),
            drawBoundries: true,
            centerpoint: targetToken.center,
            trackDistance: true, 
            crosshairsConfig: {
                size: canvas.grid.distance * targetToken.document.width / 2,
                icon: targetToken.document.texture.src,
                resolution: targetToken.document.width % 2 === 0 ? -1 : 1
            }
        });
        let xOffset = targetToken.document.width * canvas.grid.size / 2;
        let yOffset = targetToken.document.height * canvas.grid.size / 2;
        if (!position.cancelled) await genericUtils.update(targetToken.document, {x: (position.x ?? targetToken.document.center.x) - xOffset, y: (position.y ?? targetToken.document.center.y) - yOffset});
        // eslint-disable-next-line no-undef
        await CanvasAnimation.getAnimation(targetToken.animationName)?.promise;
    }
    let weapons = targetToken.actor.items.filter(i => i.type === 'weapon' && i.system.equipped);
    let selectedWeapon;
    if (!weapons.length) {
        genericUtils.notify('CHRISPREMADES.Macros.Antagonize.NoWeapons', 'info');
        return;
    }
    if (weapons.length > 1) {
        selectedWeapon = await dialogUtils.selectDocumentDialog(item.name, 'CHRISPREMADES.Macros.Antagonize.SelectWeapon', weapons, {userId});
    }
    if (!selectedWeapon) selectedWeapon = weapons[0];
    let nearbyTargets = tokenUtils.findNearby(targetToken, selectedWeapon.system.range.value, 'any').filter(i => i.document.disposition !== token.document.disposition);
    if (!nearbyTargets.length) {
        genericUtils.notify('CHRISPREMADES.Macros.FallenPuppet.NoTargets', 'info');
        return;
    }
    let selection = await dialogUtils.selectTargetDialog(item.name, 'CHRISPREMADES.Macros.Antagonize.SelectTarget', nearbyTargets);
    if (!selection?.length) return;
    let target = selection[0].document;
    await socketUtils.remoteRollItem(selectedWeapon, {}, {targetUuids: [target.uuid]}, userId);
}
export let curseOfTheFallenPuppet = {
    name: 'Blood Curse of the Fallen Puppet',
    version: '0.12.64',
    midi: {
        actor: [
            {
                pass: 'sceneRollFinished',
                macro: late,
                priority: 50
            }
        ]
    },
    ddbi: {
        removedItems: {
            'Blood Curse of the Fallen Puppet': [
                'Blood Curses: Blood Curse of the Fallen Puppet'
            ]
        }
    }
};