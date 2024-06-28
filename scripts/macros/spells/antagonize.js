import {dialogUtils, effectUtils, genericUtils, socketUtils, tokenUtils} from '../../utils.js';
async function use({workflow}) {
    if (!workflow.failedSaves.size) return;
    for (let targetToken of workflow.failedSaves) {
        if (tokenUtils.checkIncapacitated(targetToken)) {
            continue;
        }
        let usedReaction = MidiQOL.hasUsedReaction(targetToken.actor);
        let nearbyTargets;
        if (!usedReaction) {
            nearbyTargets = tokenUtils.findNearby(targetToken, 5, 'ally', true);
        }
        if (usedReaction || !nearbyTargets.length) {
            let effectData = {
                name: workflow.item.name,
                img: workflow.item.img,
                origin: workflow.item.uuid,
                duration: {
                    seconds: 12
                },
                changes: [
                    {
                        key: 'flags.midi-qol.disadvantage.attack.all',
                        mode: 0,
                        value: 1,
                        priority: 20
                    }
                ],
                flags: {
                    dae: {
                        specialDuration: [
                            'turnStartSource',
                            '1Attack'
                        ]
                    }
                }
            };
            await effectUtils.createEffect(targetToken.actor, effectData, {identifier: 'antagonize'});
        } else {
            let weapons = targetToken.actor.items.filter(i => i.type === 'weapon' && i.system.equipped);
            let selectedWeapon;
            if (!weapons.length) {
                await dialogUtils.confirm(workflow.item.name, 'CHRISPREMADES.antagonize.noWeapons', {userId: socketUtils.gmID()});
                continue;
            }
            if (weapons.length === 1) {
                selectedWeapon = weapons[0];
            } else {
                selectedWeapon = await dialogUtils.selectDocumentDialog(workflow.item.name, 'CHRISPREMADES.antagonize.selectWeapon', weapons, {userId: socketUtils.gmID()});
                if (!selectedWeapon) continue;
            }
            let target;
            let selected;
            if (nearbyTargets.length === 1) {
                target = nearbyTargets[0].document;
            } else {
                [{document: target}, selected] = await dialogUtils.selectTargetDialog(workflow.item.name, 'CHRISPREMADES.antagonize.selectTarget', nearbyTargets);
                if (!selected) continue;
            }
            await socketUtils.remoteRollItem(selectedWeapon, {}, {targetUuids: [target.uuid]}, socketUtils.firstOwner(targetToken).id);
        }
    }
}
export let antagonize = {
    name: 'Antagonize',
    version: '0.12.0',
    midi: {
        item: [
            {
                pass: 'RollComplete',
                macro: use,
                priority: 50
            }
        ]
    }
};