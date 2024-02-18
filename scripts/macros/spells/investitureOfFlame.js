import {chris} from '../../helperFunctions.js';
import {tokenMove} from '../../utility/movement.js';
import {constants} from '../../constants.js';
import {fireShield} from './fireShield.js';
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    if (!workflow.token) return;
    async function effectMacro() {
        await warpgate.revert(token.document, 'Investiture of Flame');
        await chrisPremades.tokenMove.remove('investitureOfFlame', token.id);
        let animation = chrisPremades.helpers.getConfiguration(origin, 'animation') ?? chrisPremades.helpers.jb2aCheck() === 'patreon';
        if (!animation) return;
        await Sequencer.EffectManager.endEffects({'name': 'Investiture of Flame', 'object': token});
    }
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Spell Features', 'Investiture of Flame - Fire', false);
    if (!featureData) return;
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Investiture of Flame - Fire');
    featureData.system.save.dc = chris.getSpellDC(workflow.item);
    featureData.flags['chris-premades'] = {
        'spell': {
            'castData': {
                'baseLevel': 6,
                'castLevel': workflow.castData.castLevel,
                'school': 'trs'
            }
        }
    }
    let effectData = {
        'name': workflow.item.name,
        'icon': workflow.item.img,
        'origin': workflow.item.uuid,
        'duration': {
            'seconds': 600
        },
        'changes': [
            {
                'key': 'system.traits.dr.value',
                'mode': 0,
                'value': 'cold',
                'priority': 20
            },
            {
                'key': 'system.traits.di.value',
                'mode': 0,
                'value': 'fire',
                'priority': 20
            },
            {
                'key': 'ATL.light.dim',
                'mode': 4,
                'value': '60',
                'priority': 20
            },
            {
                'key': 'ATL.light.bright',
                'mode': 4,
                'value': '30',
                'priority': 20
            }
        ],
        'flags': {
            'effectmacro': {
                'onDelete': {
                    'script': chris.functionToString(effectMacro)
                }
            },
            'chris-premades': {
                'vae': {
                    'button': featureData.name
                }
            },
            'autoanimations': {
                'isEnabled': false,
                'version': 5
            }
        }
    };
    let updates = {
        'embedded': {
            'Item': {
                [featureData.name]: featureData
            },
            'ActiveEffect': {
                [effectData.name]: effectData
            }
        }
    };
    let options = {
        'permanent': false,
        'name': 'Investiture of Flame',
        'description': 'Investiture of Flame'
    };
    await warpgate.mutate(workflow.token.document, updates, {}, options);
    let castLevel = workflow.castData.castLevel;
    let spellDC = chris.getSpellDC(workflow.item);
    let sourceTokenID = workflow.token.id;
    let range = 5;
    let damage = '4d8';
    let damageType = 'fire';
    let effect = chris.findEffect(workflow.actor, workflow.item.name);
    if (!effect) return;
    await tokenMove.add('investitureOfFlame', castLevel, spellDC, damage, damageType, sourceTokenID, range, true, true, 'end', effect.uuid);
    let animation = chris.getConfiguration(workflow.item, 'animation') ?? chris.jb2aCheck() === 'patreon';
    if (!animation) return;
    await fireShield.animation(workflow.token, 'fire', 'Investiture of Flame');
}
async function moved(token, castLevel, spellDC, damage, damageType, sourceTokenID, reason) {
    let doDamage = false;
    if (!chris.inCombat()) {
        doDamage = true;
    } else {
        let turnName = reason === 'move' ? 'current' : 'previous';
        let combatant = game.combat.combatants.get(game.combat[turnName].combatantId);
        let lastTriggerTurn = combatant.flags?.['chris-premades']?.spell?.investitureOfFlame?.[sourceTokenID]?.lastTriggerTurn;
        let currentTurn = game.combat[turnName].round + '-' + game.combat[turnName].turn;
        if (!lastTriggerTurn || lastTriggerTurn != currentTurn) {
            doDamage = true;
            await combatant.setFlag('chris-premades', 'spell.investitureOfFlame.' + sourceTokenID + '.lastTriggerTurn', currentTurn);
        }
    }
    if (!doDamage) return;
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Spell Features', 'Investiture of Flame - Heat', false);
    if (!featureData) return;
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Investiture of Flame - Heat');
    featureData.system.save.dc = spellDC;
    featureData.flags['chris-premades'] = {
        'spell': {
            'castData': {
                'baseLevel': 6,
                'castLevel': castLevel,
                'school': 'trs'
            }
        }
    }
    let [config, options] = constants.syntheticItemWorkflowOptions([token.uuid]);
    let sourceToken = canvas.tokens.get(sourceTokenID);
    if (!sourceToken) return;
    let feature = new CONFIG.Item.documentClass(featureData, {'parent': sourceToken.actor});
    await MidiQOL.completeItemUse(feature, config, options);
}
export let investitureOfFlame = {
    'item': item,
    'moved': moved
}