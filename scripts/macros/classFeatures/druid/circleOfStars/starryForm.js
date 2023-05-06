import {chris} from '../../helperFunctions.js';
export async function starryForm({speaker, actor, token, character, item, args}) {

    let form = await chris.dialog('Which Constellation?', [['Starry Form: Archer', 'Archer'], ['Starry Form: Dragon', 'Dragon'], ['Starry Form: Chalice', 'Chalice']]);
    let starry = actor.items.find(i => i.name === 'Starry Form');
    const tier = actor.classes.druid.system.levels > 13 ? 3 : actor._classes.druid.system.levels > 9 ? 2 : 1;

    let featureData;
    if (form === 'Archer') { featureData = await chris.getItemFromCompendium('chris-premades.CPR Class Feature Items', 'Starry Form: Luminous Arrow', false); }
    if (form === 'Chalice') { featureData = await chris.getItemFromCompendium('chris-premades.CPR Class Feature Items', 'Starry Form: Healing Chalice', false); }

    async function effectMacro () {
        await warpgate.revert(token.document, 'Starry Form');
    }
    async function everyTurn () {
        let change = await chris.dialog('Change Constellation?', [['Yes', true], ['No', false]]);
        if (!change) return;
        let item = actor.items.find(i => i.name === 'Starry Form');
        item.executeMacro();
    }

    let changes = [
        { key: "ATL.light.bright", value: "10", mode: 5, priority: null },
        { key: "ATL.light.dim", value: "20", mode: 5, priority: null },
        { key: "ATL.light.color", value: "#ffffff", mode: 5, priority: null },
        { key: "ATL.light.alpha", value: "0.25", mode: 5, priority: null },
        { key: "ATL.light.animation", value: "{\"type\": \"starlight\", \"speed\": 1,\"intensity\": 3}", mode: 5, priority: null }]

    if (tier === 3){
        changes.push({ key: "system.traits.dr.value", value: "slashing", mode: 2, priority: null});
        changes.push({ key: "system.traits.dr.value", value: "piercing", mode: 2, priority: null});
        changes.push({ key: "system.traits.dr.value", value: "bludgeoning", mode: 2, priority: null});
        }
    if (form === "Dragon"){
        changes.push({ key: "flags.midi-qol.min.ability.check.wis", value: "10", mode: 5, priority: null});
        changes.push({ key: "flags.midi-qol.min.ability.check.int", value: "10", mode: 5, priority: null});
        changes.push({ key: "flags.midi-qol.min.ability.save.con", value: "10", mode: 5, priority: null});
        if (tier > 1){
            changes.push({ key: "system.attributes.movement.fly", value: "20", mode: 4, priority: 25});
        }
    }

    let effectData = {
        changes: changes,
        origin: starry.uuid,
        disabled: false,
        duration: { "seconds": 600, "duration": 600, "remaining": 600, "label": "600Seconds"},
        icon: starry.img,
        label: starry.name,
        flags: { 
                    effectmacro: { onDelete: { script: chris.functionToString(effectMacro) }}
                }
    }
    if (tier > 1){
        effectData.flags['effectmacro'].onTurnStart = {'script': chris.functionToString(everyTurn)};
    }

    let itemUpdates = {
        'embedded': {
        },
    };
    let itemDetails = {
        'permanent': false,
        'name': `${starry.name}`,
        'description': `${starry.name}`
    };
    if (form != 'Dragon'){
        effectData.flags['chris-premades'] = { 'vae': { 'button': featureData.name }}
        itemUpdates.embedded['Item'] = { [featureData.name]: featureData }
    }

    let existing = actor.effects.find(ef => ef.label.includes("Starry Form"))
    if (existing){
        let label = `${starry.name}: ${form}`;
        await warpgate.revert(token.document, `${starry.name}`);
        let updates = { 'changes': changes, 'label': label };
        await chris.updateEffect(existing, updates);

        if (form != "Dragon"){
            await warpgate.mutate(token.document, itemUpdates, {}, itemDetails);
            existing.setFlag('chris-premades', 'vae', { 'button': featureData.name });
            }
        else {        
            existing.unsetFlag('chris-premades', 'vae');
        }
    }
    else {
    await chris.createEffect(actor, effectData);
        if (form != 'Dragon'){
            await warpgate.mutate(token.document, itemUpdates, {}, itemDetails);
        }
    }
}