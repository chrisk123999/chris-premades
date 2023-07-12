import {chris} from '../../../helperFunctions.js';
export async function trance({speaker, actor, token, character, item, args, scope, workflow}) {
    let tools = {
        'alchemist': 'Alchemist\'s Supplies',
        'brewer': 'Brewer\'s Supplies',
        'calligrapher': 'Calligrapher\'s Supplies',
        'carpenter': 'Carpenter\'s Tools',
        'cartographer': 'Cartographer\'s Tools',
        'cobbler': 'Cobbler\'s Tools',
        'cook': 'Cook\'s Utensils',
        'glassblower': 'Glassblower\'s Tools',
        'jeweler': 'Jeweler\'s Tools',
        'leatherworker': 'Leatherworker\'s Tools',
        'mason': 'Mason\'s Tools',
        'painter': 'Painter\'s Supplies',
        'potter': 'Potter\'s Tools',
        'smith': 'Smith\'s Tools',
        'tinker': 'Tinker\'s Tools',
        'weaver': 'Weaver\'s Tools',
        'woodcarver': 'Woodcarver\'s Tools',
        'disg': 'Disguise Kit',
        'forg': 'Forgery Kit',
        'herb': 'Herbalism Kit',
        'navg': 'Navigator\'s Tools',
        'pois': 'Poisoner\'s Kit',
        'thief': 'Thieves\' Tools'
    }
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
    let selection = await warpgate.menu({
        'inputs': [
            {
                'label': 'Skill:',
                'type': 'select',
                'options': Object.entries(CONFIG.DND5E.skills).map(([i, j]) => ({'value': i, 'html': j.label}))
            },
            {
                'label': 'Weapon or Tool:',
                'type': 'select',
                'options': Object.keys(CONFIG.DND5E.weaponIds).map(i => ({'value': i, 'html': i.charAt(0).toUpperCase() + i.slice(1)})).concat(Object.keys(tools).map(i => ({'value': i, 'html': tools[i]})))
            }
        ],
        'buttons': [
            {
                'label': 'Cancel',
                'value': false
            },
            {
                'label': 'OK',
                'value': true
            }
        ]
    }, {
        'title': workflow.item.name,
        'render': dialogRender
    });
    if (!selection.buttons) return;
    let effect = chris.findEffect(workflow.actor, 'Trance');
    if (effect) await chris.removeEffect(effect);
    let effectData = {
        'label': 'Trance',
        'icon': workflow.item.img,
        'origin': workflow.item.uuid,
        'changes': [
            {
                'key': 'system.skills.' + selection.inputs[0] +'.value',
                'mode': 4,
                'value': '1',
                'priority': 20
            }
        ]
    }
}