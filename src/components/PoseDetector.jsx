import React, { useRef, useEffect, useState } from "react";
import Webcam from "react-webcam";
import { Pose } from "@mediapipe/pose";
import { Camera } from "@mediapipe/camera_utils";
import { drawSkeleton } from "../utils/drawUtils";
import { detectSquat } from "../utils/squatLogic";

export default function PoseDetector() {
    const webcamRef = useRef(null);
    const canvasRef = useRef(null);

    const [facingMode, setFacingMode] = useState("user");
    const [squats, setSquats] = useState(0);
    const [angle, setAngle] = useState(0);
    const [trafficLight, setTrafficLight] = useState("red");

    const cameraRef = useRef(null);
    const poseRef = useRef(null);

    useEffect(() => {
        startPose();
        return () => cameraRef.current?.stop();
    }, [facingMode]);

    const waitForVideo = () =>
        new Promise((resolve) => {
            const check = () => {
                if (
                    webcamRef.current &&
                    webcamRef.current.video &&
                    webcamRef.current.video.readyState === 4
                ) {
                    resolve();
                } else {
                    setTimeout(check, 100);
                }
            };
            check();
        });

    const startPose = async () => {
        if (cameraRef.current) cameraRef.current.stop();

        await waitForVideo();

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

        const cam = new Camera(webcamRef.current.video, {
            onFrame: async () => {
                await poseRef.current.send({ image: webcamRef.current.video });
            },
            width: 640,
            height: 480,
        });

        cameraRef.current = cam;
        cam.start();
    };

    const onResults = (results) => {
        const ctx = canvasRef.current.getContext("2d");
        ctx.save();
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        ctx.drawImage(
            results.image,
            0,
            0,
            canvasRef.current.width,
            canvasRef.current.height
        );

        if (!results.poseLandmarks) {
            ctx.restore();
            return;
        }

        drawSkeleton(results.poseLandmarks, ctx);

        // ---- FIX: aseguramos que existan las articulaciones ----
        if (
            !results.poseLandmarks[23] ||
            !results.poseLandmarks[25] ||
            !results.poseLandmarks[27]
        ) {
            ctx.restore();
            return;
        }

        const { angle: kneeAngle, squatCount } =
            detectSquat(results.poseLandmarks);

        setAngle(kneeAngle);
        setSquats(squatCount);

        if (kneeAngle > 160) setTrafficLight("red");
        else if (kneeAngle > 90) setTrafficLight("yellow");
        else setTrafficLight("green");

        ctx.restore();
    };

    const toggleCamera = () => {
        setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
    };

    return (
        <div>
            <button
                onClick={toggleCamera}
                style={{ margin: 10, padding: "10px 20px" }}
            >
                Cambiar cámara
                ({facingMode === "user" ? "Frontal" : "Trasera"})
            </button>

            <Webcam
                ref={webcamRef}
                style={{ display: "none" }}
                videoConstraints={{
                    facingMode,
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
                        width: 70,
                        height: 70,
                        borderRadius: "50%",
                        margin: "auto",
                        backgroundColor:
                            trafficLight === "red"
                                ? "red"
                                : trafficLight === "yellow"
                                    ? "yellow"
                                    : "limegreen",
                        border: "4px solid #333",
                    }}
                />
            </div>

            <h2>Ángulo: {angle.toFixed(0)}°</h2>
            <h1>Sentadillas: {squats}</h1>
        </div>
    );
}
