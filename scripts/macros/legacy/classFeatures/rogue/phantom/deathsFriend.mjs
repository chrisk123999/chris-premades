async function wailsFromTheGraveTargets({data: {targetToken}}) {
    return targetToken;
}
export const deathsFriend = {
    name: 'Death\'s Friend',
    version: '2.0.0',
    rules: '2014',
    called: [
        {
            pass: 'actorWailsFromTheGraveTargets',
            macro: wailsFromTheGraveTargets,
            priority: 50
        }
    ]
};
