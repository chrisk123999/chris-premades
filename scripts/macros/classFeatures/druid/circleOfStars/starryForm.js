import {chris} from '../../../../helperFunctions.js';
export async function starryForm({speaker, actor, token, character, item, args, scope, workflow}) {
    let effect = chris.findEffect(workflow.actor, 'Starry Form - Passive');
    if (!effect) return;
    let starry = await fromUuid(effect.origin);
    if (!starry) return;
    let selection = await chris.dialog('Starry Form: Which Constellation?', [['Archer', 'Archer'], ['Dragon', 'Dragon'], ['Chalice', 'Chalice']]);
    let tier = workflow.actor.classes.druid.system.levels > 13 ? 3 : workflow.actor.classes.druid.system.levels > 9 ? 2 : 1;
    let featureData;
    switch (selection) {
        case 'Archer':
            featureData = await chris.getItemFromCompendium('chris-premades.CPR Class Feature Items', 'Starry Form: Luminous Arrow', false);
            featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Starry Form: Luminous Arrow');
            break;
        case 'Dragon':
            featureData = await chris.getItemFromCompendium('chris-premades.CPR Class Feature Items', 'Starry Form: Wise Dragon', false);
            featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Starry Form: Wise Dragon');
            break;
        case 'Chalice':
            featureData = await chris.getItemFromCompendium('chris-premades.CPR Class Feature Items', 'Starry Form: Healing Chalice', false);
            featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Starry Form: Healing Chalice');
            break;
    }
    async function effectMacro() {
        await warpgate.revert(token.document, 'Starry Form');
    }
    async function turnStart() {
        let change = await chrisPremades.helpers.dialog('Twinkling Constellations: Change Constellation?', [['Yes', true], ['No', false]]);
        if (!change) return;
        let otherEffect = chrisPremades.helpers.findEffect(actor, 'Twinkling Constellations');
        if (!otherEffect) return;
        let otherEffectItem = await fromUuid(otherEffect.origin);
        if (!otherEffectItem) return;
        await otherEffectItem.use();
    }
    let changes = [
        {
            'key': 'ATL.light.bright',
            'value': '10',
            'mode': 5,
            'priority': 20
        },
        {
            'key': 'ATL.light.dim',
            'value': '20',
            'mode': 5,
            'priority': 20
        },
        {
            'key': 'ATL.light.color',
            'value': '#ffffff',
            'mode': 5,
            'priority': 20
        },
        {
            'key': 'ATL.light.alpha',
            'value': '0.25',
            'mode': 5,
            'priority': 20
        },
        {
            'key': 'ATL.light.animation',
            'value': '{\'type\': \'starlight\', \'speed\': 1,\'intensity\': 3}',
            'mode': 5,
            'priority': 20
        }
    ];
    if (tier === 3) {
        changes.push({
            'key': 'system.traits.dr.value',
            'value': 'slashing',
            'mode': 2,
            'priority': 20
        });
        changes.push({
            'key': 'system.traits.dr.value',
            'value': 'piercing',
            'mode': 2,
            'priority': 20
        });
        changes.push({
            'key': 'system.traits.dr.value',
            'value': 'bludgeoning',
            'mode': 2,
            'priority': 20
        });
    }
    if (selection === 'Dragon') {
        changes.push({
            'key': 'flags.midi-qol.min.ability.check.wis',
            'value': '10',
            'mode': 5,
            'priority': 20
        });
        changes.push({
            'key': 'flags.midi-qol.min.ability.check.int',
            'value': '10',
            'mode': 5,
            'priority': 20
        });
        changes.push({
            'key': 'flags.midi-qol.min.ability.save.con',
            'value': '10',
            'mode': 5,
            'priority': 20
        });
        if (tier > 1){
            changes.push({
                'key': 'system.attributes.movement.fly',
                'value': '20',
                'mode': 4,
                'priority': 20
            });
        }
    }
    let duration = 600;
    let existing = workflow.actor.effects.find(eff => eff.flags['chris-premades']?.feature?.starryForm === true);
    if (existing) {
        duration = existing.duration.remaining;
    }
    let effectData = {
        'changes': changes,
        'origin': starry.uuid,
        'disabled': false,
        'duration': {
            'seconds': duration
        },
        'icon': starry.img,
        'label': starry.name + ': ' + selection,
        'flags': {
            'effectmacro': {
                'onDelete': {
                    'script': chris.functionToString(effectMacro)
                }
            },
            'dae': {
                'transfer': true
            },
            'chris-premades': {
                'feature': {
                    'starryForm': true
                }
            }
        }
    }
    if (tier > 1){
        effectData.flags['effectmacro'].onTurnStart = {
            'script': chris.functionToString(turnStart)
        };
    }
    if (selection != 'Dragon') {
        effectData.flags['chris-premades'].vae = {
            'button': featureData.name
        };
    }
    let updates = {
        'embedded': {
            'Item': {
                [featureData.name]: featureData
            },
            'ActiveEffect': {
                [effectData.label]: effectData
            }
        }
    };
    let options = {
        'permanent': false,
        'name': 'Starry Form',
        'description': 'Starry Form'
    };
    if (existing) await warpgate.revert(workflow.token.document, 'Starry Form');
    await warpgate.mutate(workflow.token.document, updates, {}, options);
}