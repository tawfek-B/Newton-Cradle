//  this file was created to avoid circular dependencies cause when calling
//  MainMenu before main
export const simulationState = {
  mass: 261.38
};

export function updateBallMass(newMass) {
    simulationState.mass = newMass;
}

export const balls = [];