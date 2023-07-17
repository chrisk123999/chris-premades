import {chris} from '../../../../helperFunctions.js';
import {queue} from '../../../../utility/queue.js';
export async function awakenedSpellbook({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.targets.size === 0) return;
    if (workflow.item.type != 'spell') {
        if (workflow.item.type === 'feat') {
            if (!workflow.item.flags['chris-premades']?.spell?.castData) return;
        } else return;
    }
    let spellLevel = workflow.item.flags['chris-premades']?.spell?.castData?.castLevel ?? workflow.castData?.castLevel;
    if (!spellLevel) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'awakenedSpellbook', 101);
    if (!queueSetup) return;
    let oldDamageRoll = workflow.damageRoll;
    let oldFlavor = oldDamageRoll.terms?.map(term=>term?.flavor)
    let spells = workflow.actor.items.filter(i => i.type === 'spell' && i.system?.level === spellLevel && i.system?.damage?.parts?.length > 0);
    let values = [];
    let effect = chris.findEffect(workflow.actor, 'Awakened Spellbook: Replace Damage');
    if (!effect) return;
    let originItem = await fromUuid(effect.origin);
    if (!originItem) return;
    switch (spellLevel){
        case 1:
            if (actor.items.getName('Magic Missile') || chris.getConfiguration(originItem, 'magicmissile')) values.push('force');
            if (actor.items.getName('Chromatic Orb') || chris.getConfiguration(originItem, 'chromaticorb')) values.push('acid', 'cold', 'fire', 'lightning', 'poison', 'thunder');
            break;
        case 2:
            if (actor.items.getName('Dragon\s Breath') || chris.getConfiguration(originItem, 'dragonsbreath')) values.push('acid', 'cold', 'fire', 'lightning', 'poison');
            break;
        case 3:
            if (actor.items.getName('Protection from Energy') || chris.getConfiguration(originItem, 'protectionfromenergy')) values.push('acid', 'cold', 'fire', 'lightning', 'thunder');
            if (actor.items.getName('Glyph of Warding') || chris.getConfiguration(originItem, 'glyphofwarding')) values.push('acid', 'cold', 'fire', 'lightning', 'thunder');
            if (actor.items.getName('Spirit Shroud') || chris.getConfiguration(originItem, 'spiritshroud')) values.push('cold', 'necrotic', 'radiant');
            if (actor.items.getName('Vampiric Touch') || chris.getConfiguration(originItem, 'vampirictouch')) values.push('necrotic');
            break;
        case 4:
            if (actor.items.getName('Elemental Bane') || chris.getConfiguration(originItem, 'elementalbane')) values.push('acid', 'cold', 'fire', 'lightning', 'thunder');
            break;
        case 5:
            if (actor.items.getName('Cloudkill') || chris.getConfiguration(originItem, 'cloudkill')) values.push('poison');
            break;
        case 7:
            if (actor.items.getName('Prismatic Spray') || chris.getConfiguration(originItem, 'prismaticspray')) values.push('acid', 'cold', 'fire', 'lightning', 'poison');
            break;
        case 8:
            if (actor.items.getName('Illusory Dragon') || chris.getConfiguration(originItem, 'illusorydragon')) values.push('acid', 'cold', 'fire', 'lightning', 'necrotic', 'poison');
           break;
        case 9:
            if (actor.items.getName('Prismatic Wall') || chris.getConfiguration(originItem, 'prismaticwall')) values.push('acid', 'cold', 'fire', 'lightning', 'poison');
            break;
    }
    values = values.filter(function(item, i, arr){return arr.indexOf(item) === i; });
    for (let i = 0; spells.length > i; i++) {
        let currentItem = spells[i];
        for (let j = 0; currentItem.system.damage.parts.length > j; j++) {
            let flavor = currentItem.system.damage.parts[j][1];
            if (!flavor) break;
            if (values.includes(flavor.toLowerCase()) === false && flavor != 'healing' && flavor != 'temphp' && flavor != 'none' && flavor != 'midi-none') values.push(flavor);
        }
    }
    if (values.length === 0) {
        queue.remove(workflow.item.uuid);
        return;
    }
    function valuesToOptions(arr) {
        let optionsPush = [];
        for (let i = 0; arr.length > i; i++) {
            if (typeof arr[i] != 'string') return;
            optionsPush.push([arr[i].charAt(0).toUpperCase() + arr[i].slice(1), arr[i]]);
        }
        return optionsPush;
    }
    let options = valuesToOptions(values);
    if (options.length < 2) {
        queue.remove(workflow.item.uuid);
        return;
    }
    options.push(['No', false]);
    let selection = await chris.dialog('Change damage type for ' + workflow.item.name + '?', options);
    if (!selection) {
        queue.remove(workflow.item.uuid);
        return;
    }
    for (let i = 0; oldFlavor.length > i; i++) {
        workflow.damageRoll.terms[i].options.flavor = selection;
        if (oldFlavor[i]) {
            workflow.damageRoll._formula = workflow.damageRoll._formula.replace(oldFlavor[i], selection);
        }
    }
    await workflow.setDamageRoll(workflow.damageRoll);
    queue.remove(workflow.item.uuid);
}