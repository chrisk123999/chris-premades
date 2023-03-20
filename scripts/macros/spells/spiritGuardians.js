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
    let options = {
        'showFullCard': false,
        'createWorkflow': true,
        'targetUuids': [token.uuid],
        'configureDialog': false,
        'versatile': false,
        'consumeResource': false,
        'consumeSlot': false,
    };
    let sourceToken = canvas.tokens.get(sourceTokenID);
    if (!sourceToken) return;
    let feature = new CONFIG.Item.documentClass(featureData, {parent: sourceToken.actor});
    await MidiQOL.completeItemUse(feature, {}, options);
}
async function item({speaker, actor, token, character, item, args}) {
    let castLevel = this.castData.castLevel;
    let spellDC = chris.getSpellDC(this.item);
    let sourceTokenID = this.token.id;
    let range = 15;
    let alignment = this.actor.system.details.alignment.toLowerCase();
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
    let effect = chris.findEffect(this.actor, 'Spirit Guardians');
    if (!effect) return;
    tokenMove.add('spiritGuardians', castLevel, spellDC, damage, damageType, sourceTokenID, range, true, true, 'start', effect.uuid);
}
async function effectEnd(token) {
    tokenMove.remove('spiritGuardians', token.id);
}
export let spiritGuardians = {
    'item': item,
    'effectEnd': effectEnd,
    'moved': moved
}