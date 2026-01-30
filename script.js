let audioCtx;
let oscillator;
let gainNode;
let isPlaying = false;

const playBtn = document.getElementById('playBtn');
const volumeSlider = document.getElementById('volumeSlider');

playBtn.addEventListener('click', () => {
    if (isPlaying) {
        stopSound();
    } else {
        startSound();
    }
});

volumeSlider.addEventListener('input', (e) => {
    if (gainNode) {
        // Smooth transition for volume change
        gainNode.gain.setTargetAtTime(parseFloat(e.target.value), audioCtx.currentTime, 0.1);
    }
});

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function startSound() {
    initAudio();

    // Resume context if suspended (browser policy)
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    oscillator = audioCtx.createOscillator();
    gainNode = audioCtx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(40, audioCtx.currentTime); // 40Hz

    // Initial volume settings with fade in
    const vol = parseFloat(volumeSlider.value);
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(vol, audioCtx.currentTime + 2); // Slow fade in

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    isPlaying = true;
    playBtn.textContent = 'Pause';
    playBtn.classList.add('playing');
}

function stopSound() {
    if (oscillator && isPlaying) {
        // Fade out
        const currentTime = audioCtx.currentTime;
        gainNode.gain.cancelScheduledValues(currentTime);
        gainNode.gain.setValueAtTime(gainNode.gain.value, currentTime);
        gainNode.gain.linearRampToValueAtTime(0, currentTime + 1);

        oscillator.stop(currentTime + 1);

        isPlaying = false;
        playBtn.textContent = 'Play';
        playBtn.classList.remove('playing');
    }
}

// Visuals Logic
const canvas = document.getElementById('visualCanvas');
const ctx = canvas.getContext('2d');
let width, height;
let particles = [];

function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    initVisuals(); // Re-init particles on resize to adjust density
}

window.addEventListener('resize', resize);

class Particle {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.radius = Math.random() * 50 + 20;
        // Cool colors: Blue, Teal, Purple (Hue 180-240)
        this.hue = Math.random() * 60 + 180;
        this.alpha = Math.random() * 0.5;
        this.phase = Math.random() * Math.PI * 2;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.phase += 0.005;

        // Wrap around
        if (this.x < -100) this.x = width + 100;
        if (this.x > width + 100) this.x = -100;
        if (this.y < -100) this.y = height + 100;
        if (this.y > height + 100) this.y = -100;

        // Gentle pulse
        this.currentRadius = this.radius + Math.sin(this.phase) * 10;
    }

    draw() {
        ctx.beginPath();
        // Soft glow effect using radial gradient
        const gradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, Math.max(0, this.currentRadius)
        );
        gradient.addColorStop(0, `hsla(${this.hue}, 70%, 60%, ${0.05 + Math.sin(this.phase) * 0.02})`);
        gradient.addColorStop(1, `hsla(${this.hue}, 70%, 60%, 0)`);

        ctx.fillStyle = gradient;
        ctx.arc(this.x, this.y, Math.max(0, this.currentRadius), 0, Math.PI * 2);
        ctx.fill();
    }
}

function initVisuals() {
    particles = [];
    const particleCount = Math.min(60, Math.floor((width * height) / 15000)); // Adjust density
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }
}

function animate() {
    // Clear with trail for soothing effect
    ctx.fillStyle = 'rgba(10, 15, 30, 0.1)'; // Dark soothing background
    ctx.fillRect(0, 0, width, height);

    particles.forEach(p => {
        p.update();
        p.draw();
    });

    requestAnimationFrame(animate);
}

// Start visuals
resize(); // This calls initVisuals
animate();
