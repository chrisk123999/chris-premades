import {addItemRecovery} from '../../../../generic/itemRecovery.mjs';
async function added({document}) {
    await addItemRecovery(document, 'warding-flare', {period: 'sr', type: 'recoverAll'});
}
export const improvedWardingFlare = {
    name: 'Improved Warding Flare',
    version: '2.0.0',
    rules: '2024',
    item: [
        {
            pass: 'created',
            macro: added,
            priority: 50
        },
        {
            pass: 'medkit',
            macro: added,
            priority: 50
        },
        {
            pass: 'munched',
            macro: added,
            priority: 50
        }
    ]
};
