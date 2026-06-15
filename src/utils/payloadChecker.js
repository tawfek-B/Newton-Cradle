import { payload } from '../payload.json'

const num = payload.numberOfBalls

export function check() {

    const jsonObject = payload;

    let objectLength = Object.keys(jsonObject.balls).length;

    while (objectLength < num) {
        const newBall = {
            "material": "metal",
            "mass": 261.38,
            "elasticity": 0.96,
            "spinOmega": 20,
            "rope": 1
        };
        
        jsonObject.balls[objectLength] = newBall;
        jsonObject.numberOfBalls = Object.keys(jsonObject.balls).length;

        objectLength = Object.keys(jsonObject.balls).length

    }
    return jsonObject
}