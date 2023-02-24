import {chris} from '../../../../helperFunctions.js';
export async function radiantSoul(workflow, pass) {
    if (workflow.item.type != 'spell') return;
    let showFeature = false;
    switch (pass) {
        case 'postDamageRoll':
            if (workflow.hitTargets.size != 1) return;
            let damageTypes = new Set();
            for (let i of workflow.damageDetail) {
                damageTypes.add(i.type);
            }
            if (!(damageTypes.has('fire') || damageTypes.has('radiant'))) return;
            let selected = await chris.dialog('Radiant Soul: Add what type of damage?', [['Radiant', '[radiant]'], ['Fire', '[fire]']]);
            if (!selected) selected = '[radiant]';
            let damageFormula = workflow.damageRoll._formula + ' + ' + workflow.actor.system.abilities.cha.mod + selected;
            let damageRoll = await new Roll(damageFormula).roll({async: true});
            await workflow.setDamageRoll(damageRoll);
            return;
        case 'preDamageApplication':
            if (workflow.hitTargets.size <= 1) return;
            let damageTypes2 = new Set();
            for (let i of workflow.item.system.damage.parts) {
                damageTypes2.add(i[1]);
            }
            if (!(damageTypes2.has('fire') || damageTypes2.has('radiant'))) return;
            let buttons = [
                {
                    'label': 'Yes',
                    'value': true
                }, {
                    'label': 'No',
                    'value': false
                }
            ];
            let selection = await chris.selectTarget('Radiant Soul: Add extra damage?', buttons, workflow.targets);
            if (selection.buttons === false) return;
            let targetTokenID = selection.inputs.find(id => id != false);
            if (!targetTokenID) return;
            let targetDamage = workflow.damageList.find(i => i.tokenId === targetTokenID);
            let selected2 = await chris.dialog('Radiant Soul: What type of damage?', [['Radiant', 'radiant'], ['Fire', 'fire']]);
            if (!selected2) selected2 = 'radiant';
            let targetActor = canvas.scene.tokens.get(targetDamage.tokenId).actor;
            if (!targetActor) return;
            let hasDI = chris.checkTrait(targetActor, 'di', selected2);
            if (hasDI) return;
            let damageTotal = workflow.actor.system.abilities.cha.mod;
            let hasDR = chris.checkTrait(targetActor, 'dr', selected2);
            if (hasDR) damageTotal = Math.floor(damageTotal / 2);
            targetDamage.damageDetail[0].push(
                {
                    'damage': damageTotal,
                    'type': selected2
                }
            );
            targetDamage.totalDamage += damageTotal;
            targetDamage.appliedDamage += damageTotal;
            targetDamage.hpDamage += damageTotal;
            if (targetDamage.oldTempHP > 0) {
                if (targetDamage.oldTempHP >= damageTotal) {
                    targetDamage.newTempHP -= damageTotal;
                } else {
                    let leftHP = damageTotal - targetDamage.oldTempHP;
                    targetDamage.newTempHP = 0;
                    targetDamage.newHP -= leftHP;
                }
            } else {
                targetDamage.newHP -= damageTotal;
            }
            return;
    }
    if (showFeature) {
        let effect = chris.findEffect(workflow.actor, 'Radiant Soul');
        if (!effect) return;
        let originItem = await fromUuid(effect.origin);
        await originItem.use();
    }
}