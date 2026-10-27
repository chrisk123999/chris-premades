async function preGrapple({data}) {
    data.advantage = true;
}
export const amorphous = {
    name: 'Amorphous',
    version: '2.1.4',
    rules: 'all',
    grapple: [
        {
            pass: 'actorPreGrapple',
            macro: preGrapple,
            priority: 50
        }
    ]
};
