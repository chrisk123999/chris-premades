/* eslint-disable no-case-declarations */
import {chris} from '../../helperFunctions.js';
import {effectAuras} from '../../utility/effectAuras.js';
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    let effect = chris.findEffect(workflow.actor, 'Lantern Of Revealing - Aura');
    let mode = effect?.flags?.['chris-premades']?.item?.lanternOfRevealing?.mode;
    let options = [];
    if (mode != 'bright') options.push(['Light Lantern (Bright)', 'bright']);
    if (mode != 'dim') options.push(['Light Lantern (Dim)', 'dim']);
    if (mode != 'extinguish') options.push(['Extinguish', 'extinguish']);
    let selection = await chris.dialog('Lantern of Revealing', options);
    if (!selection) return;
    let effectData;
    switch (selection) {
        case 'bright':
            if (effect) {
                if (mode === 'bright') return;
                await chris.removeEffect(effect);
            }
            async function effectMacro() {
                await chrisPremades.macros.lanternOfRevealing.end(token);
            }
            effectData = {
                'name': 'Lantern Of Revealing - Aura',
                'icon': workflow.item.img,
                'duration': {
                    'seconds': 21600
                },
                'origin': workflow.item.uuid,
                'changes': [
                    {
                        'key': 'ATL.light.dim',
                        'mode': 4,
                        'value': 60,
                        'priority': 20
                    },
                    {
                        'key': 'ATL.light.bright',
                        'mode': 4,
                        'value': 30,
                        'priority': 20
                    },
                    {
                        'key': 'flags.chris-premades.aura.lanternOfRevealing.name',
                        'mode': 5,
                        'value': 'lanternOfRevealing',
                        'priority': 20
                    },
                    {
                        'key': 'flags.chris-premades.aura.lanternOfRevealing.castLevel',
                        'mode': 5,
                        'value': 1,
                        'priority': 20
                    },
                    {
                        'key': 'flags.chris-premades.aura.lanternOfRevealing.range',
                        'mode': 5,
                        'value': 30,
                        'priority': 20
                    },
                    {
                        'key': 'flags.chris-premades.aura.lanternOfRevealing.disposition',
                        'mode': 5,
                        'value': 'all',
                        'priority': 20
                    },
                    {
                        'key': 'flags.chris-premades.aura.lanternOfRevealing.effectName',
                        'mode': 5,
                        'value': 'Lantern Of Revealing - Revealed',
                        'priority': 20
                    },
                    {
                        'key': 'flags.chris-premades.aura.lanternOfRevealing.macroName',
                        'mode': 5,
                        'value': 'lanternOfRevealing',
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
                        'item': {
                            'lanternOfRevealing': {
                                'mode': 'bright'
                            }
                        }
                    }
                }
            };
            await chris.createEffect(workflow.actor, effectData);
            let flagAuras = {
                'lanternOfRevealing': {
                    'name': 'lanternOfRevealing',
                    'castLevel': 1,
                    'range': 30,
                    'disposition': 'all',
                    'effectName': 'Lantern Of Revealing - Revealed',
                    'macroName': 'lanternOfRevealing'
                }
            };
            effectAuras.add(flagAuras, workflow.token.document.uuid, true);
            return;
        case 'dim':
            if (effect) {
                if (mode === 'dim') return;
                await chris.removeEffect(effect);
            }
            effectData = {
                'name': 'Lantern Of Revealing - Aura',
                'icon': workflow.item.img,
                'duration': {
                    'seconds': 21600
                },
                'origin': workflow.item.uuid,
                'changes': [
                    {
                        'key': 'ATL.light.dim',
                        'mode': 4,
                        'value': 5,
                        'priority': 20
                    }
                ],
                'flags': {
                    'chris-premades': {
                        'item': {
                            'lanternOfRevealing': {
                                'mode': 'dim'
                            }
                        }
                    }
                }
            };
            await chris.createEffect(workflow.actor, effectData);
            return;
        case 'extinguish':
            if (effect) await chris.removeEffect(effect);
            return;
    }
}
async function aura(token, selectedAura) {
    let originToken = await fromUuid(selectedAura.tokenUuid);
    if (!originToken) return;
    let originActor = originToken.actor;
    let auraEffect = chris.findEffect(originActor, 'Lantern Of Revealing - Aura');
    if (!auraEffect) return;
    let originItem = effect.parent;
    if (!originItem) return;
    let effectData = {
        'name': 'Lantern Of Revealing - Revealed',
        'icon': originItem.img,
        'origin': originItem.uuid,
        'duration': {
            'seconds': 604800
        },
        'changes': [
            {
                'key': 'system.traits.ci.value',
                'value': 'invisible',
                'mode': 0,
                'priority': 20
            }
        ],
        'flags': {
            'chris-premades': {
                'aura': true,
                'effect': {
                    'noAnimation': true
                }
            }
        }
    };
    let effect = chris.findEffect(token.actor, effectData.name);
    if (effect?.origin === effectData.origin) return;
    if (effect) chris.removeEffect(effect);
    await chris.createEffect(token.actor, effectData);
}
async function end(token) {
    effectAuras.remove('lanternOfRevealing', token.document.uuid);
}
export let lanternOfRevealing = {
    'item': item,
    'aura': aura,
    'end': end
};