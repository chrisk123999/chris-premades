import {chris} from '../../helperFunctions.js';
async function blinkTurnStart(token, actor, origin, effect) {
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Spell Features', 'Blink Landing', false);
	if (!featureData) return;
    if (origin?.type === 'spell') featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Blink Landing');
    let feature = new CONFIG.Item.documentClass(featureData, {parent: actor});
    let options = {
        'showFullCard': false,
        'createWorkflow': true,
        'targetUuids': [token.uuid],
        'configureDialog': false,
        'versatile': false,
        'consumeResource': false,
        'consumeSlot': false,
    };
    await MidiQOL.completeItemUse(feature, {}, options);
    await effect.delete();
}
async function blinkTurnEnd(actor) {
    let blinkRoll = await new Roll('1d20').roll({async: true});
    blinkRoll.toMessage({
        rollMode: 'roll',
        speaker: {alias: name},
        flavor: 'Blink'
    });
    if (blinkRoll.total < 11) return;
    async function effectMacro() {
        await chrisPremades.macros.blink.start(token, actor, origin, effect);
    }
    let blinkEffect = chris.findEffect(actor, 'Blink');
    let originUuid;
    if (blinkEffect) originUuid = blinkEffect.origin;
    let effectData = {
        'label': 'Blinked Away',
        'icon': 'icons/magic/air/wind-stream-purple.webp',
        'duration': {
            'rounds': 2
        },
        'origin': originUuid,
        'changes': [
            {
                'key': 'flags.midi-qol.superSaver.all',
                'value': '1',
                'mode': 5,
                'priority': 20
            },
            {
                'key': 'system.attributes.ac.bonus',
                'value': '100',
                'mode': 5,
                'priority': 20
            },
            {
                'key': 'flags.midi-qol.min.ability.save.all',
                'value': '100',
                'mode': 5,
                'priority': 20
            },
            {
                'key': 'flags.midi-qol.fail.critical.all',
                'value': '1',
                'mode': 5,
                'priority': 20
            },
            {
                'key': 'macro.tokenMagic',
                'value': 'spectral-body',
                'mode': 0,
                'priority': 20
            }
        ],
        'flags': {
            'effectmacro': {
                'onTurnStart': {
                    'script': chris.functionToString(effectMacro)
                }
            }
        }
    };
    await chris.createEffect(actor, effectData);
}
export let blink = {
    'start': blinkTurnStart,
    'end': blinkTurnEnd
}