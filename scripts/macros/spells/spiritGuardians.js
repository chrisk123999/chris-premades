import {constants} from '../../constants.js';
import {chris} from '../../helperFunctions.js';
import {tokenMove} from '../../movement.js';
async function moved(token, castLevel, spellDC, damage, damageType, sourceTokenID) {
    let doDamage = false;
    if (!chris.inCombat()) {
        doDamage = true;
    } else {
        let combatant = game.combat.combatants.get(game.combat.current.combatantId);
        let lastTriggerTurn = combatant.flags?.['chris-premades']?.spell?.spiritGuardians?.[sourceTokenID]?.lastTriggerTurn;
        let currentTurn = game.combat.current.round + '-' + game.combat.current.turn;
        if (!lastTriggerTurn || lastTriggerTurn != currentTurn) {
            doDamage = true;
            await combatant.setFlag('chris-premades', 'spell.spiritGuardians.' + sourceTokenID + '.lastTriggerTurn', currentTurn);
        }
    }
    if (!doDamage) return;
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Spell Features', 'Spirit Guardians', false);
    if (!featureData) return;
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Spirit Guardians');
    featureData.system.damage.parts = [
        [
            damage + '[' + damageType + ']',
            damageType
        ]
    ];
    featureData.system.save.dc = spellDC;
    featureData.flags['chris-premades'] = {
        'spell': {
            'castData': {
                'baseLevel': 3,
                'castLevel': castLevel,
                'school': 'con'
            }
        }
    }
    featureData.flags['chris-premades'].spell.castData.school = 'con';
    let [config, options] = constants.syntheticItemWorkflowOptions([token.uuid]);
    let sourceToken = canvas.tokens.get(sourceTokenID);
    if (!sourceToken) return;
    let feature = new CONFIG.Item.documentClass(featureData, {'parent': sourceToken.actor});
    await MidiQOL.completeItemUse(feature, config, options);
}
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    let castLevel = workflow.castData.castLevel;
    let spellDC = chris.getSpellDC(workflow.item);
    let sourceTokenID = workflow.token.id;
    let range = 15;
    let alignment = workflow.actor.system.details.alignment.toLowerCase();
    let damageType;
    if (alignment.includes('good') || alignment.includes('neutral')) {
        damageType = 'radiant';
    } else if (alignment.includes('evil')) {
        damageType = 'necrotic'
    } else {
        damageType = await chris.dialog('What is your alignment?', [['Good or Neutral (Radiant)', 'radiant'], ['Evil (Necrotic)', 'necrotic']]);
        if (!damageType) damageType = 'radiant';        
    }
    let damage = castLevel + 'd8';
    let effect = chris.findEffect(workflow.actor, 'Spirit Guardians');
    if (!effect) return;
    await tokenMove.add('spiritGuardians', castLevel, spellDC, damage, damageType, sourceTokenID, range, true, true, 'start', effect.uuid);
    let color = chris.getConfiguration(workflow.item, 'color') ?? 'blueyellow';
    if (color === 'random') {
        let colors = [
            'blueyellow',
            'blue.ring',
            'dark_black.ring',
            'dark_blue.ring',
            'dark_purple.ring',
            'dark_red.ring',
            'dark_whiteblue.ring',
            'green.ring',
            'orange.ring',
            'greenorange.ring',
            'pinkpurple.ring'
        ];
        color = colors[Math.floor(Math.random() * colors.length)];
    }
    new Sequence().effect().file('jb2a.spirit_guardians.' + color).attachTo(workflow.token).persist().name('SpiritGuardians-' + workflow.token.id).fadeIn(300).fadeOut(300).play();
}
async function effectEnd(token) {
    await tokenMove.remove('spiritGuardians', token.id);
    Sequencer.EffectManager.endEffects({ 'name': 'SpiritGuardians-' + token.id, 'object': token});
}
export let spiritGuardians = {
    'item': item,
    'effectEnd': effectEnd,
    'moved': moved
}