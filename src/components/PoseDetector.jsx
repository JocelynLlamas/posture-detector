import React, { useRef, useEffect, useState } from "react";
import Webcam from "react-webcam";
import { Pose } from "@mediapipe/pose";
import { drawSkeleton } from "../utils/drawUtils";
import { detectSquat } from "../utils/squatLogic";
import { Camera } from "@mediapipe/camera_utils";


export default function PoseDetector() {
    const webcamRef = useRef(null);
    const canvasRef = useRef(null);

    const [squats, setSquats] = useState(0);
    const [angle, setAngle] = useState(0);
    const [facingMode, setFacingMode] = useState("user");
    const [trafficLight, setTrafficLight] = useState("red");
    const cameraRef = useRef(null);
    const poseRef = useRef(null);

    useEffect(() => {
        initializePose();

        return () => {
            if (cameraRef.current) cameraRef.current.stop();
        };
    }, [facingMode]); // ← Cambia cuando cambiamos cámara

    const initializePose = () => {
        if (cameraRef.current) cameraRef.current.stop();

        const pose = new Pose({
            locateFile: (file) =>
                `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
        });

        pose.setOptions({
            modelComplexity: 1,
            smoothLandmarks: true,
            enableSegmentation: false,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5,
        });

        pose.onResults(onResults);
        poseRef.current = pose;

        // Esperar un poquito a que la webcam inicialice el video
        setTimeout(() => {
            if (webcamRef.current && webcamRef.current.video) {
                const newCamera = new Camera(webcamRef.current.video, {
                    onFrame: async () => {
                        await pose.send({ image: webcamRef.current.video });
                    },
                    width: 640,
                    height: 480,
                });

                cameraRef.current = newCamera;
                newCamera.start();
            }
        }, 500);
    };

    const onResults = (results) => {
        const canvasCtx = canvasRef.current.getContext("2d");
        const { angle: kneeAngle, squatCount } = detectSquat(results.poseLandmarks);
        setAngle(kneeAngle);
        setSquats(squatCount);
        canvasCtx.save();

        canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

        canvasCtx.drawImage(
            results.image,
            0,
            0,
            canvasRef.current.width,
            canvasRef.current.height
        );

        if (results.poseLandmarks) {
            drawSkeleton(results.poseLandmarks, canvasCtx);

            const { angle: kneeAngle, squatCount } =
                detectSquat(results.poseLandmarks);

            setAngle(kneeAngle);
            setSquats(squatCount);
        }

        // Lógica del semáforo
        if (kneeAngle > 160) {
            setTrafficLight("red"); // demasiado arriba
        } else if (kneeAngle > 90 && kneeAngle <= 160) {
            setTrafficLight("yellow"); // transición
        } else if (kneeAngle <= 90) {
            setTrafficLight("green"); // postura correcta para sentadilla
        }

        canvasCtx.restore();
    };

    const toggleCamera = () => {
        setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
    };

    return (
        <div>
            <button
                onClick={toggleCamera}
                style={{
                    marginBottom: "10px",
                    padding: "10px 20px",
                    fontSize: "16px",
                    cursor: "pointer",
                }}
            >
                Cambiar cámara ({facingMode === "user" ? "Frontal" : "Trasera"})
            </button>

            <Webcam
                ref={webcamRef}
                style={{ display: "none" }}
                videoConstraints={{
                    facingMode: facingMode,
                    width: 640,
                    height: 480,
                }}
            />

            <canvas
                ref={canvasRef}
                width={640}
                height={480}
                style={{ border: "2px solid #333" }}
            />

            <div style={{ marginTop: "20px" }}>
                <div
                    style={{
                        width: "70px",
                        height: "70px",
                        borderRadius: "50%",
                        margin: "auto",
                        backgroundColor:
                            trafficLight === "red"
                                ? "red"
                                : trafficLight === "yellow"
                                    ? "yellow"
                                    : "limegreen",
                        border: "4px solid #333",
                        boxShadow: "0 0 15px rgba(0,0,0,0.4)"
                    }}
                ></div>

                <h3 style={{ marginTop: "10px" }}>
                    Estado: {trafficLight === "red" ? "Muy arriba" : trafficLight === "yellow" ? "Bajando..." : "¡Perfecto!"}
                </h3>
            </div>


            <h2>Ángulo de rodilla: {angle.toFixed(0)}°</h2>
            <h1>Sentadillas: {squats}</h1>
        </div>
    );
}
