import {chris} from '../../../helperFunctions.js';
export async function wildshape({speaker, actor, token, character, item, args, scope, workflow}) {
    if (!game.modules.get('quick-insert')?.active) {
        ui.notifications.warn('This feature requires the Quick Insert module to be active!');
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
            if (selected.uuid === item.actor.uuid) {
                ui.notifications.warn('You cannot wildshape into yourself!');
                return;
            }
            selectedActor = await fromUuid(selected.uuid);
            if (selectedActor.compendium) {
                ui.notifications.warn('The actor must not be in a compendium!');
                return;
            }
            if (!selectedActor) return;
            let durationSeconds = chris.itemDuration(item).seconds;
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
            console.log(wildshapeActor);
            delete wildshapeActor.token;
            delete wildshapeActor.items;
            delete wildshapeActor.effects;
            delete wildshapeActor.type;
            delete wildshapeActor.flags;
            delete wildshapeActor.folder;
            wildshapeActor.name += ' (' + workflow.actor.name + ')';
            delete wildshapeActor.sort;
            delete wildshapeActor._id;
            delete wildshapeActor._stats;
            delete wildshapeActor.ownership;
            let texture = wildshapeActor.prototypeToken.texture;
            let wildshapeToken = {
                'name': wildshapeActor.name,
                'texture': texture,
                'width': wildshapeActor.prototypeToken.width,
                'height': wildshapeActor.prototypeToken.height
            }
            delete wildshapeActor.prototypeToken;
            wildshapeActor.prototypeToken = wildshapeToken;
            wildshapeActor.system.abilities.cha = workflow.actor.system.abilities.cha;
            wildshapeActor.system.abilities.int = workflow.actor.system.abilities.int;
            wildshapeActor.system.abilities.wis = workflow.actor.system.abilities.wis;
            wildshapeActor.system.attributes.prof = workflow.actor.system.attributes.prof;
            // prof stuff here
            let mutateOptions = {
                'name': 'Wildshape',
            }
            async function effectMacro() {
                await warpgate.revert(token.document, 'Wildshape');
            }
            let effectData = {
                'label': workflow.item.name,
                'icon': workflow.item.img,
                'duration': {
                    'seconds': durationSeconds
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
            if (workflow.actor.classes.druid?.system?.level === 20) delete effectData.changes;
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
            let targetItems = selectedActor.items.contents;
            for (let i of targetItems) {
                itemUpdates[i.name] = i.toObject();
            }
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
            console.log(updates);
            await warpgate.mutate(workflow.token.document, updates, {}, mutateOptions);
        }
    });
}