import {chris} from '../../../../helperFunctions.js';
export async function zealousPresence({speaker, actor, token, character, item, args}) {
    if (this.targets.size <= 10) return;
    let buttons = [
        {
            'label': 'OK',
            'value': true
        }, {
            'label': 'Cancel',
            'value': false
        }
    ];
    let selection = await chris.selectTarget('Who should get targeted? Max: 10', buttons, Array.from(this.targets), false, 'multiple');
    if (!selection.buttons) return;
    let newTargets = [];
    for (let i of selection.inputs) {
        let count = 0;
        if (i) {
            count++;
            if (count > 10) {
                ui.notifications.info('Too many targets selected!');
                break;
            }
            newTargets.push(i);
        }
    }
    chris.updateTargets(newTargets);
}