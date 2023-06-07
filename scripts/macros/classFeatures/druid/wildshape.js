import {chris} from '../../../helperFunctions.js';
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    if (!game.modules.get('quick-insert')?.active) {
        ui.notifications.warn('This feature requires the Quick Insert module to be active!');
        return;
    }
    let mutationStack = warpgate.mutationStack(workflow.token.document);
    let mutateItem = mutationStack.getName('Wild Shape');
    if (mutateItem) {
        ui.notifications.warn('Revert forms before using this feature again!');
        return;
    }
    let filter = 'wildshape';
    if (workflow.actor.flags['chris-premades']?.feature?.wildshape?.moon) filter = 'wildshape-moon';
    let customFilter = workflow.actor.flags['chris-premades']?.feature?.wildshape?.custom;
    if (customFilter) filter = customFilter;
    let selectedActor;
    if (!QuickInsert.hasIndex) await QuickInsert.forceIndex();
    QuickInsert.open({
        'allowMultiple': false,
        'restrictTypes': ['Actor'],
        'filter': filter,
        'onSubmit': async (selected) => {
            if (!selected) return;
            if (selected.uuid === workflow.item.actor.uuid) {
                ui.notifications.warn('You cannot Wild Shape into yourself!');
                return;
            }
            selectedActor = await fromUuid(selected.uuid);
            if (selectedActor.compendium) {
                ui.notifications.warn('The actor must not be in a compendium!');
                return;
            }
            if (!selectedActor) return;
            let equipedItems = workflow.actor.items.filter(i => i.system.equipped);
            let selection;
            if (equipedItems.length > 0) {
                let buttons = [
                    {
                        'label': 'Ok',
                        'value': true
                    }, {
                        'label': 'Cancel',
                        'value': false
                    }
                ];
                let options = [
                    'Merge / Drop',
                    'Wear'
                ];
                function dialogRender(html) {
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
                let config = {
                    'title': 'What happens to your equipment?',
                    'render': dialogRender
                };
                let generatedInputs = [];
                for (let i of equipedItems) {
                    generatedInputs.push({
                        'label': i.name,
                        'type': 'select',
                        'options': options,
                        'value': i.uuid
                    });
                }
                selection = await warpgate.menu(
                    {
                        'inputs': generatedInputs,
                        'buttons': buttons
                    },
                    config
                );
                if (!selection) return;
            }
            let wildshapeActor = selectedActor.toObject();
            delete wildshapeActor.token;
            delete wildshapeActor.items;
            delete wildshapeActor.effects;
            delete wildshapeActor.type;
            delete wildshapeActor.flags;
            delete wildshapeActor.folder;
            delete wildshapeActor.name;
            delete wildshapeActor.sort;
            delete wildshapeActor._id;
            delete wildshapeActor._stats;
            delete wildshapeActor.ownership;
            let texture = wildshapeActor.prototypeToken.texture;
            let wildshapeToken = {
                'name': selectedActor.name + ' (' + workflow.actor.name + ')',
                'texture': texture,
                'width': wildshapeActor.prototypeToken.width,
                'height': wildshapeActor.prototypeToken.height
            }
            wildshapeActor.prototypeToken = wildshapeToken;
            wildshapeActor.system.abilities.cha = workflow.actor.system.abilities.cha;
            wildshapeActor.system.abilities.int = workflow.actor.system.abilities.int;
            wildshapeActor.system.abilities.wis = workflow.actor.system.abilities.wis;
            wildshapeActor.system.attributes.prof = workflow.actor.system.attributes.prof;
            delete wildshapeActor.system.attributes.attunement;
            delete wildshapeActor.system.attributes.death;
            delete wildshapeActor.system.attributes.encumbrance;
            delete wildshapeActor.system.attributes.exhuastion;
            delete wildshapeActor.system.attributes.hd;
            delete wildshapeActor.system.attributes.init;
            delete wildshapeActor.system.attributes.inspiration;
            delete wildshapeActor.system.attributes.spellcasting;
            delete wildshapeActor.system.attributes.spelldc;
            delete wildshapeActor.system.bonuses;
            delete wildshapeActor.system.currency;
            delete wildshapeActor.system.details;
            delete wildshapeActor.system.resources;
            delete wildshapeActor.system.scale;
            let sourceSkills = workflow.actor.system.skills;
            let targetSkills = selectedActor.system.skills;
            let skills = {};
            for (let i of Object.keys(sourceSkills)) {
                if (targetSkills[i].proficient > sourceSkills[i].proficient) skills[i] = {'value': targetSkills[i].proficient};
            }
            wildshapeActor.system.skills = skills;
            delete wildshapeActor.system.tools;
            wildshapeActor.system.traits = {
                'size': selectedActor.system.traits.size
            };
            delete wildshapeActor.system.spells;
            let mutateOptions = {
                'name': 'Wild Shape',
            }
            async function effectMacro() {
                await warpgate.revert(token.document, 'Wild Shape');
            }
            let druidLevels = workflow.actor.classes.druid?.system?.levels;
            if (!druidLevels) return;
            let effectData = {
                'label': 'Wild Shape',
                'icon': workflow.item.img,
                'duration': {
                    'seconds': Math.min(druidLevels / 2) * 3600
                },
                'changes': [
                    {
                        'key': 'flags.midi-qol.fail.spell.vocal',
                        'value': '1',
                        'mode': 0,
                        'priority': 20
                    },
                    {
                        'key': 'flags.midi-qol.fail.spell.somatic',
                        'value': '1',
                        'mode': 0,
                        'priority': 20
                    },
                    {
                        'key': 'flags.midi-qol.fail.spell.material',
                        'value': '1',
                        'mode': 0,
                        'priority': 20
                    }
                ],
                'origin': workflow.item.uuid,
                'flags': {
                    'effectmacro': {
                        'onDelete': {
                            'script': chris.functionToString(effectMacro)
                        }
                    }
                },
                'transfer': true
            };
            if (druidLevels === 20) delete effectData.changes;
            let invalidTypes = [
                'weapon',
                'equipment',
                'consumable',
                'tool',
                'container',
                'loot',
                'backpack'
            ];
            let items = workflow.actor.items.filter(i => invalidTypes.includes(i.type) && !i.system.equipped);
            let itemUpdates = {};
            for (let i of items) {
                itemUpdates[i.name] = warpgate.CONST.DELETE
            }
            if (selection) {
                for (let i = 0; selection.inputs.length > i; i++) {
                    if (selection.inputs[i] === 'Merge / Drop') {
                        itemUpdates[equipedItems[i].name] = warpgate.CONST.DELETE;
                    }
                }
            }
            let primalStrike = workflow.actor.flags['chris-premades']?.feature?.primalStrike;
            let insigniaOfClaws = workflow.actor.flags['chris-premades']?.item?.insigniaOfClaws;
            let targetItems = selectedActor.items.contents;
            for (let i of targetItems) {
                itemUpdates[i.name] = i.toObject();
                if (primalStrike && itemUpdates[i.name].type === 'weapon') setProperty(itemUpdates[i.name], 'system.properties.mgc', true);
                if (insigniaOfClaws && itemUpdates[i.name].type === 'weapon') {
                    try {
                        itemUpdates[i.name].system.damage.parts[0][0] += ' + 1';
                    } catch (error) {}
                    itemUpdates[i.name].system.attackBonus = 1;
                }
                itemUpdates[i.name].flags['tidy5e-sheet'] = {'favorite': true};
                if (invalidTypes.includes(itemUpdates[i.name].type)) continue;
                itemUpdates[i.name].flags['custom-character-sheet-sections'] = {'sectionName': 'Wild Shape'}
            }
            let featureData = await chris.getItemFromCompendium('chris-premades.CPR Class Feature Items', 'Wild Shape - Revert', false);
            if (!featureData) return;
            featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Wild Shape - Revert');
            itemUpdates[featureData.name] = featureData;
            let updates = {
                'token': wildshapeToken,
                'actor': wildshapeActor,
                'embedded': {
                    'Item': itemUpdates,
                    'ActiveEffect': {
                        [effectData.label]: effectData
                    }
                }
            }
            await warpgate.mutate(workflow.token.document, updates, {}, mutateOptions);
        }
    });
}
async function hook() {
    //handle rollover damage
}
async function revert({speaker, actor, token, character, item, args, scope, workflow}) {
    let effect = chris.findEffect(workflow.token.actor, 'Wild Shape');
    if (!effect) return;
    await chris.removeEffect(effect);
}
export let wildShape = {
    'item': item,
    'hook': hook,
    'revert': revert
}