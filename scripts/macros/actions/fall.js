/* eslint-disable no-case-declarations */
import {chris} from '../../helperFunctions.js';
export async function fall({speaker, actor, token, character, item, args, scope, workflow}) {
    let targetToken = game.user.targets.first();
    function render(html) {
        let ths = html[0].getElementsByTagName('th');
        for (let t of ths) {
            t.style.width = 'auto';
            t.style.textAlign = 'left';
        }
        let tds = html[0].getElementsByTagName('td');
        for (let t of tds) {
            t.style.width = '50px';
            t.style.textAlign = 'center';
            t.style.paddingRight = '5px';
        }
    }
    let selection = await warpgate.menu({
        'inputs': [
            {
                'label': 'Distance (ft):',
                'type': 'number'
            },
            {
                'label': 'Type of Fall:',
                'type': 'select',
                'options': [
                    {
                        'html': 'Onto Ground',
                        'value': 'ground'
                    },
                    {
                        'html': 'Into Water',
                        'value': 'water'
                    },
                    {
                        'html': 'Onto Another Creature',
                        'value': 'creature'
                    }
                ]
            }
        ],
        'buttons': [
            {
                'label': 'Cancel',
                'value': false
            },
            {
                'label': 'Ok',
                'value': true
            }
        ]
    },
    {
        'title': 'Fall Damage',
        'render': render
    });
    if (!selection.buttons) return;
    let diceNum = Math.min((Math.floor(selection.inputs[0] / 10) * 10), 200) / 10;
    if (diceNum === 0) return;
    let damageFormula = diceNum + 'd6[bludgeoning]';
    async function ground(actor) {
        if (chris.findEffect(actor, 'Prone') || chris.checkTrait(actor, 'ci', 'prone')) return;
        await chris.addCondition(actor, 'Prone', false);
    }
    let otherTarget = false;
    switch (selection.inputs[1]) {
        case 'water':
            if (chris.findEffect(workflow.actor, 'Reaction')) break;
            let selection2 = await chris.dialog('Use reaction to to hit the surface head or feet first?', [['Yes (Acrobatics)', 'acr'], ['Yes (Athletics)', 'ath'], ['No', false]]);
            if (!selection2) break;
            let flavor = {
                'acr': 'Acrobatics',
                'ath': 'Athletics'
            };
            let check = await workflow.actor.rollSkill(selection2, {'flavor': flavor[selection2] + ' Skill Check (DC: 15)'});
            if (check.total >= 15) damageFormula = 'floor(' + damageFormula + ' / 2)';
            await chris.addCondition(workflow.actor, 'Reaction', false);
            break;
        case 'creature':
            if (game.user.targets.size != 1) {
                ui.notifications.info('Select one target and try again!');
                return;
            }
            let targetSize = chris.getSize(targetToken.actor);
            let sourceSize = chris.getSize(workflow.actor);
            if (sourceSize === 0 || targetSize === 0) {
                ui.notifications.info('One or both creatures are tiny!');
                await ground(workflow.actor);
                break;
            }
            let save = await targetToken.actor.rollAbilitySave('dex', {'flavor': 'Dexterity Saving Throw (DC: 15)', 'skipDialog': true});
            if (save.total < 15) {
                damageFormula = 'floor(' + damageFormula + ' / 2)';
                otherTarget = true;
                if (targetSize - sourceSize >= 2) break;
                await ground(targetToken.actor);
            }
            break;
    }
    await ground(workflow.actor);
    let damageRoll = await chris.damageRoll(workflow, damageFormula);
    await workflow.setDamageRolls([damageRoll]);
    if (otherTarget) await chris.applyDamage([targetToken], damageRoll.total, 'bludgeoning');
}
