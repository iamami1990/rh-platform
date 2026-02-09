const path = require('path');
const fs = require('fs');
const faceapi = require('@vladmandic/face-api/dist/face-api.node-wasm.js');
const { Canvas, Image, ImageData, loadImage } = require('@napi-rs/canvas');
require('@tensorflow/tfjs');
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

const MODEL_PATH = path.join(__dirname, '..', 'models', 'face');
let modelsLoaded = false;

const loadModels = async () => {
    if (modelsLoaded) return;
    const requiredManifest = path.join(MODEL_PATH, 'ssd_mobilenetv1_model-weights_manifest.json');
    if (!fs.existsSync(requiredManifest)) {
        throw new Error('Face model files not found. See backend/models/face/README.md');
    }
    await faceapi.nets.ssdMobilenetv1.loadFromDisk(MODEL_PATH);
    await faceapi.nets.faceLandmark68Net.loadFromDisk(MODEL_PATH);
    await faceapi.nets.faceRecognitionNet.loadFromDisk(MODEL_PATH);
    modelsLoaded = true;
};

const getEmbeddingFromBase64 = async (imageBase64) => {
    if (!imageBase64) return null;
    await loadModels();

    const cleaned = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(cleaned, 'base64');
    const img = await loadImage(buffer);

    const detection = await faceapi
        .detectSingleFace(img)
        .withFaceLandmarks()
        .withFaceDescriptor();

    if (!detection || !detection.descriptor) return null;
    return Array.from(detection.descriptor);
};

const cosineDistance = (a, b) => {
    if (!a || !b || a.length !== b.length) return 1;
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    return 1 - (dot / (Math.sqrt(normA) * Math.sqrt(normB)));
};

const findBestMatch = (embedding, storedEmbeddings, threshold = 0.5) => {
    let best = null;
    let bestDistance = Infinity;

    for (const record of storedEmbeddings) {
        const dist = cosineDistance(embedding, record.embeddings);
        if (dist < bestDistance) {
            bestDistance = dist;
            best = record;
        }
    }

    if (!best || bestDistance > threshold) return null;
    return { match: best, distance: bestDistance };
};

module.exports = {
    getEmbeddingFromBase64,
    findBestMatch
};
