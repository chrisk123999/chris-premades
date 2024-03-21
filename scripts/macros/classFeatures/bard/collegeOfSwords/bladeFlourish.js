import {constants} from '../../../../constants.js';
import {chris} from '../../../../helperFunctions.js';
import {queue} from '../../../../utility/queue.js';
async function attack({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.item.flags?.['chris-premades']?.spell?.boomingBlade || workflow.item.flags?.['chris-premades']?.spell?.greenFlameBlade) return;
    let feature = chris.getItem(workflow.actor, 'Blade Flourish');
    let feature2 = chris.getItem(workflow.actor, 'Defensive Flourish');
    let feature3 = chris.getItem(workflow.actor,'Mobile Flourish');
    let feature4 = chris.getItem(workflow.actor,'Slashing Flourish');
    let movement = chris.getItem(workflow.actor, 'Blade Flourish Movement');
    if (!movement || !feature || !feature2 || !feature3 || !feature4) return;
    let movementEffect = chris.findEffect(workflow.actor, 'Blade Flourish Movement');
    if (constants.weaponAttacks.includes(workflow.item.system.actionType) && !movementEffect && chris.inCombat()) await movement.use();
    let perTurnCheck = chris.perTurnCheck(feature, 'feature', 'bladeFlourish', false, workflow.token.id);
    if (!perTurnCheck) return;
    if (constants.weaponAttacks.includes(workflow.item.system.actionType) && workflow.hitTargets.size === 1) {
        let bardicInspiration = chris.getItem(workflow.actor, 'Bardic Inspiration');
        if (!bardicInspiration) return;
        let queueSetup = await queue.setup(workflow.item.uuid, 'bladeFlourish', 151);
        if (!queueSetup) return;
        let bardicInspirationUses = bardicInspiration.system.uses.value;
        let mastersFlourish = chris.getItem(workflow.actor, 'Master\'s Flourish');
        let skipUses = mastersFlourish ? await chris.dialog(mastersFlourish.name, constants.yesNo, 'Use d6 instead of Bardic Inspiration for Blade Flourish?') : false;
        if (bardicInspirationUses <= 0 && !skipUses) {
            queue.remove(workflow.item.uuid);
            return;
        }
        let options = [
            ['Defensive Flourish', 'DF'],
            ['Mobile Flourish', 'MF'],
            ['Slashing Flourish', 'SF'],
            ['No', false]
        ];
        let selectedOption = await chris.dialog(feature.name, options, 'Use a Blade Flourish?');
        if (!selectedOption) {
            queue.remove(workflow.item.uuid);
            return;
        }
        await chris.setTurnCheck(feature, 'feature', 'bladeFlourish');
        if (!skipUses) bardicInspiration.update({'system.uses.value': bardicInspirationUses - 1});
        let bardicInspirationDie = workflow.actor.system.scale.bard['bardic-inspiration'];
        if (skipUses) bardicInspirationDie = {'formula': '1d6'};
        if (!bardicInspirationDie) return;
        let damageType = workflow.item.system.damage.parts[0][1];
        let bonusDamageFormula = bardicInspirationDie.formula + '[' + damageType + ']'
        await chris.addToDamageRoll(workflow, bonusDamageFormula);
        let bardicInspirationDieRoll = workflow.damageRolls[workflow.damageRolls.length - 1].total;
        switch (selectedOption) {
            case 'DF':
                await feature2.use();
                let effectData2 = {
                    'label': feature2.name,
                    'icon': feature2.img,
                    'duration': {'rounds': 1},
                    'changes': [
                        {
                            'key': 'system.attributes.ac.bonus',
                            'mode': 2,
                            'value': '+' + bardicInspirationDieRoll,
                            'priority': 20
                        }
                    ],
                    'origin': feature2.uuid,
                    'flags': {
                        'dae': {
                            'specialDuration': [
                                'combatEnd'
                            ]
                        }
                    }
                };
                await chris.createEffect(workflow.actor, effectData2);
                break;
            case 'MF':
                await feature3.use();
                let distance = Math.floor((5 + bardicInspirationDieRoll) / 5) * 5;
                let push = await chris.dialog(feature3.name, constants.yesNo, 'Push target ' + (5 + bardicInspirationDieRoll) + ' feet?');
                if (push) await chris.pushToken(workflow.token, workflow.targets.first(), distance);
                break;
            case 'SF':
                await feature4.use();
                let nearbyTargets = chris.findNearby(workflow.token, 5, 'enemy').filter(i => i.document.uuid != workflow.hitTargets.first().document.uuid);
                await chris.applyWorkflowDamage(workflow.token, await chris.damageRoll(workflow, String(bardicInspirationDieRoll), undefined, true), damageType, nearbyTargets, feature4.name, workflow.itemCardId);
                break;
        }
        queue.remove(workflow.item.uuid);
    }
}
async function combatEnd(parent) {
    await chris.setTurnCheck(parent, 'feature', 'bladeFlourish', true);
}
export let bladeFlourish = {
    'attack': attack,
    'combatEnd': combatEnd
}