import { calculateAngle } from "./drawUtils";

let stage = "up";  // puede ser "up" o "down"
let squatCount = 0;

export function detectSquat(landmarks) {
    const hip = landmarks[23];       // cadera derecha
    const knee = landmarks[25];      // rodilla derecha
    const ankle = landmarks[27];     // tobillo derecho

    const angle = calculateAngle(hip, knee, ankle);

    // Bajando (rodilla < 90°)
    if (angle < 90 && stage === "up") {
        stage = "down";
    }

    // Subiendo (rodilla > 160°)
    if (angle > 160 && stage === "down") {
        stage = "up";
        squatCount++;
    }

    return { angle, squatCount };
}
