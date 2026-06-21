const didYouKnowFacts = [
    "Every atom in your body has experienced countless collisions over billions of years, transferring energy much like a gigantic cosmic Newton's Cradle.",
    "A photon can travel for billions of years across the universe before colliding with a single atom in your eye.",
    "The air around you is constantly transferring momentum between trillions of molecules every second.",
    "When neutron stars collide, they can release more energy in a moment than our Sun will emit in its entire lifetime.",
    "The particles inside solid steel are mostly empty space held together by electromagnetic forces.",
    "If Earth suddenly stopped moving around the Sun, its momentum would carry it in a straight line into deep space.",
    "A cue ball break in professional billiards demonstrates the same conservation laws that govern galaxy collisions.",
    "Gravitational waves are ripples in spacetime created by massive objects transferring energy through the universe.",
    "The atoms in a steel Newton's Cradle were forged inside ancient stars that exploded long before Earth existed.",
    "The sound of a Newton's Cradle is energy escaping the system, making perpetual motion impossible.",
    "A single collision between atoms can determine whether a chemical reaction occurs or never happens.",
    "The fastest-moving particles in the universe travel so close to light speed that time passes differently for them.",
    "If you removed all energy losses from a Newton's Cradle, it could theoretically swing forever.",
    "The Large Hadron Collider accelerates particles to energies over a million times greater than a flying mosquito.",
    "Most of the universe's matter is invisible and has never been directly observed.",
    "At absolute zero temperature, atoms still retain quantum motion and never become perfectly still.",
    "The Moon slowly steals Earth's rotational energy, causing days to become longer over millions of years.",
    "Every step you take slightly changes Earth's motion through conservation of momentum.",
    "A black hole collision can briefly outshine every star in the observable universe combined.",
    "The atoms in your left hand and right hand are constantly exchanging momentum through tiny electromagnetic interactions.",
    "Some quantum particles can tunnel through barriers they should not be able to cross according to classical physics.",
    "The energy released by a single lightning bolt could power a typical home for weeks.",
    "If the Sun disappeared instantly, Earth would continue moving in a straight line due to inertia.",
    "Neutron star matter is so dense that a sugar-cube-sized piece would outweigh Mount Everest.",
    "The universe may ultimately end with every collision becoming impossible as galaxies drift beyond one another's reach.",
    "The same physical laws that govern a desk toy also govern colliding galaxies and black holes.",
    "When two galaxies collide, individual stars almost never crash into each other because space is mostly empty.",
    "A particle striking Earth's atmosphere can carry more energy than a professionally thrown baseball.",
    "The observable universe contains enough stars that counting one per second would take trillions of years.",
    "Every impact in a Newton's Cradle is a tiny reminder that energy and momentum have survived unchanged since the birth of the universe."
];

const didYouKnowDiv = document.createElement('div');
didYouKnowDiv.style.position = 'absolute';
didYouKnowDiv.style.zIndex = '9999';
didYouKnowDiv.style.bottom = '-200px';
didYouKnowDiv.style.left = '20px';
didYouKnowDiv.style.transition =
    'opacity 1s ease, bottom 1s ease';
didYouKnowDiv.style.width = '250px';
didYouKnowDiv.style.maxWidth = '70vw';
didYouKnowDiv.style.padding = '18px 28px 18px 24px';
didYouKnowDiv.style.border = '2px solid white';
didYouKnowDiv.style.borderRadius = '18px';
didYouKnowDiv.style.background = 'rgba(0, 0, 0, 0)';
didYouKnowDiv.style.backdropFilter = 'blur(12px)';
didYouKnowDiv.style.color = '#FFFFFF';
didYouKnowDiv.style.fontFamily = 'Segoe UI, Arial, sans-serif';
didYouKnowDiv.style.fontSize = '1.05rem';
didYouKnowDiv.style.textAlign = 'left';
didYouKnowDiv.style.boxShadow = '0 4px 24px 0 rgba(0,0,0,0.18)';
didYouKnowDiv.style.opacity = '0';
didYouKnowDiv.style.pointerEvents = 'none';
didYouKnowDiv.style.zIndex = '1000';
didYouKnowDiv.innerHTML = '';

document.body.appendChild(didYouKnowDiv);

export function showRandomFact() {

    const fact = didYouKnowFacts[
        Math.floor(Math.random() * didYouKnowFacts.length)
    ];

    didYouKnowDiv.innerHTML = `
    <span style="font-weight:bold;font-size:1.1rem;letter-spacing:0.5px;">
      Did you know?
    </span>
    <br>
    <span style="font-size:1rem;">
      ${fact}
    </span>
  `;

    // Slide up into view
    didYouKnowDiv.style.bottom = '20px';
    didYouKnowDiv.style.opacity = '1';

    setTimeout(() => {
        // Slide back down off-screen
        didYouKnowDiv.style.opacity = '0';
        didYouKnowDiv.style.bottom = '-200px';
    }, 12000);
}