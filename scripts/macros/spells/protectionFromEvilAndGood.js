async function save({trigger}) {
    return {label: 'CHRISPREMADES.Macros.ProtectionFromEvilAndGood.Save', type: 'advantage'};
}
export let protectionFromEvilAndGood = {
    name: 'Protection from Evil and Good',
    version: '0.12.64',
    save: [
        {
            pass: 'context',
            macro: save,
            priority: 50
        }
    ]
};