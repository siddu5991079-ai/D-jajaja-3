const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const { spawn, execSync } = require('child_process');
const { PuppeteerScreenRecorder } = require('puppeteer-screen-recorder');

// 🚀 NAYA: Multi-Stream Key Manager
const STREAM_KEYS = {
    '1': '14601603391083_14040893622891_puxzrwjniu', // Aapka pehla key
    '2': '14601696583275_14041072274027_apdzpdb5xi', // ⚠️ INKO APNE ASLI KEYS SE REPLACE KAREIN
    '3': '14617940008555_14072500914795_ohw67ls7ny',
    '4': '14601972227691_14041593547371_obdhgewlmq',
    '5': 'YOUR_STREAM_KEY_5_HERE'
};

const TARGET_URL = process.env.TARGET_URL || 'https://dadocric.st/player.php?id=starsp3&v=m';
const SELECTED_CHANNEL = process.env.OKRU_STREAM_ID || '1';
const ACTIVE_STREAM_KEY = STREAM_KEYS[SELECTED_CHANNEL] || STREAM_KEYS['1'];

const RTMP_SERVER = 'rtmp://vsu.okcdn.ru/input/';
const RTMP_DESTINATION = `${RTMP_SERVER}${ACTIVE_STREAM_KEY}`;

let browser = null;
let ffmpegProcess = null;

// =========================================================================
// 🔄 MAIN LOOP: Agar stream rukay toh 3 sec baad poora process restart karega
// =========================================================================
async function mainLoop() {
    while (true) {
        try {
            await startDirectStreaming();
        } catch (error) {
            console.error(`\n[!] ALERT: ${error.message}`);
            console.log('[*] 🔄 Restarting everything in 3 seconds as requested...');
            await cleanup();
            await new Promise(resolve => setTimeout(resolve, 3000)); // 3 Seconds Refresh Delay
        }
    }
}

async function startDirectStreaming() {
    console.log(`[*] Starting browser and FFmpeg...`);
    console.log(`[+] Broadcasting to OK.ru CHANNEL: ${SELECTED_CHANNEL}`);

    const useProxy = process.env.USE_PROXY === 'ON';
    const proxyIpPort = process.env.PROXY_IP_PORT || '31.59.20.176:6754';
    const proxyUser = process.env.PROXY_USER || 'kexwytuq';
    const proxyPass = process.env.PROXY_PASS || 'fw1k19a4lqfd';
    
    const streamQuality = process.env.STREAM_QUALITY || '110KBps (Balanced 480p)';

    const browserArgs = [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--window-size=1280,720',
        '--kiosk', 
        '--autoplay-policy=no-user-gesture-required'
    ];

    if (useProxy) {
        browserArgs.push(`--proxy-server=http://${proxyIpPort}`);
    }

    console.log(`Launching Browser on GitHub Actions Virtual Screen with Proxy: ${useProxy ? 'ON' : 'OFF'}...`);
    browser = await puppeteer.launch({
        channel: 'chrome',
        headless: false, 
        defaultViewport: { width: 1280, height: 720 },
        ignoreDefaultArgs: ['--enable-automation'], 
        args: browserArgs
    });

    const page = await browser.newPage();

    const pages = await browser.pages();
    for (const p of pages) {
        if (p !== page) await p.close();
    }

    // Aggressive Ad-Popup Blocker
    browser.on('targetcreated', async (target) => {
        if (target.type() === 'page') {
            try {
                const newPage = await target.page();
                if (newPage && newPage !== page) {
                    console.log(`[*] Adware tab detected! Forcing video tab back to foreground visually...`);
                    await page.bringToFront(); 
                    setTimeout(() => newPage.close().catch(() => { }), 2000);
                }
            } catch (e) { }
        }
    });

    if (useProxy) {
        await page.authenticate({ username: proxyUser, password: proxyPass });
        console.log("Proxy credentials applied successfully.");
    }

    // =========================================================================
    // 🎥 GUI Visual Recorder (20 Sec Debug to GitHub Releases)
    // =========================================================================
    const recorder = new PuppeteerScreenRecorder(page);
    const fileName = `debug_video_${Date.now()}.mp4`;
    await recorder.start(fileName);
    console.log(`🎥 [*] 20-second Visual Debug Recording Started: ${fileName}...`);

    setTimeout(async () => {
        try {
            await recorder.stop();
            console.log('🛑 [*] Visual Screen recording stopped. Uploading to GitHub Releases...');
            const tagName = `visual-debug-${Date.now()}`;
            execSync(`gh release create ${tagName} ${fileName} --title "Puppeteer Visual Capture"`, { stdio: 'inherit' });
            console.log('✅ [+] Successfully uploaded visual debug wrapper!');
        } catch (err) {
            console.error('❌ [!] Failed to upload visual debug wrapper:', err.message);
        }
    }, 20000);

    const displayNum = process.env.DISPLAY || ':99';

    console.log(`[*] Navigating to target URL: ${TARGET_URL}...`);
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });

    console.log('[*] Waiting for potential Cloudflare...');
    for (let i = 0; i < 15; i++) {
        const title = await page.title();
        if (!title.includes('Moment') && !title.includes('Cloudflare')) break;
        await new Promise(r => setTimeout(r, 1000));
    }

    await new Promise(resolve => setTimeout(resolve, 8000));

    // =========================================================================
    // 🧠 THE SMART SCANNER & CLEANER 
    // =========================================================================
    let targetFrame = null;
    console.log('[*] Scanning iframes for the REAL Live Stream Video...');
    for (const frame of page.frames()) {
        try {
            // 1. Asli video frame dhoondo (Project 1 Integration)
            const isRealLiveStream = await frame.evaluate(() => {
                // 🚀 PROJECT 1: Selecting the specific clappr/html5 video element
                const vid = document.querySelector('video[data-html5-video]') || document.querySelector('video');
                if (!vid) return false;
                if (vid.clientWidth < 300 || vid.clientHeight < 200) return false;
                return true; 
            });

            if (isRealLiveStream) {
                targetFrame = frame;
                console.log(`[+] Smart Scanner selected Real Video in frame: ${frame.url() || 'unknown'}`);
            }

            // 2. "onmouseup" wale khatarnaak Ad/Overlay ko code se tabah karo!
            await frame.evaluate(() => {
                const floatedAd = document.getElementById('floated');
                if (floatedAd) {
                    floatedAd.remove(); // Hamesha ke liye delete!
                    console.log('DEBUG: Asli ad overlay (floated) completely removed!');
                }
            });

        } catch (e) { }
    }

    if (!targetFrame) throw new Error('No <video> element could be found.');

    // =========================================================================
    // 🔊 AUDIO UNLOCKER: The Center Click
    // =========================================================================
    console.log('[*] Applying Physical Center Click to register User Action for Audio...');
    try {
        const iframeEl = await targetFrame.frameElement();
        const box = await iframeEl.boundingBox();
        if (box) {
            await page.mouse.click(box.x + (box.width / 2), box.y + (box.height / 2), { delay: 100 });
            console.log('[+] Real physical click executed on the center of the video player.');
        }
        await new Promise(r => setTimeout(r, 2000));
    } catch (e) {
        console.log('[!] Center click failed: ', e.message);
    }

    console.log('[*] Executing JS Unmute & Volume Max logic...');
    await targetFrame.evaluate(async () => {
        // 🚀 PROJECT 1: Selecting the specific clappr/html5 video element
        const video = document.querySelector('video[data-html5-video]') || document.querySelector('video');
        if (!video) return false;
        
        video.muted = false; 
        video.volume = 1.0; 
        
        await video.play().catch(e => {});
        return true;
    });

    // =========================================================================
    // 🛠️ REUSABLE FUNCTIONS 
    // =========================================================================
    async function applyFullscreenHack() {
        console.log('\n[*] Executing Fullscreen Script...');
        const debugLogs = await targetFrame.evaluate(async () => {
            let terminalLogs = [];
            // 🚀 PROJECT 1: Selecting the specific clappr/html5 video element
            const vid = document.querySelector('video[data-html5-video]') || document.querySelector('video');
            if (!vid) return terminalLogs;
            
            try {
                if (vid.requestFullscreen) await vid.requestFullscreen();
                else if (vid.webkitRequestFullscreen) await vid.webkitRequestFullscreen();
                terminalLogs.push("🎉 RESULT: requestFullscreen() SUCCESS!");
            } catch (err) {
                vid.style.position = 'fixed';
                vid.style.top = '0';
                vid.style.left = '0';
                vid.style.width = '100vw';
                vid.style.height = '100vh';
                vid.style.zIndex = '2147483647';
                vid.style.backgroundColor = 'black';
                vid.style.objectFit = 'contain';
                terminalLogs.push("✅ RESULT: CSS Force-Stretch Hack Successfully lag gaya!");
            }
            return terminalLogs;
        });
        for (const log of debugLogs) console.log(log);
        await new Promise(r => setTimeout(r, 2000));
    }

    function startBroadcast() {
        if (ffmpegProcess) return; 
        
        let ffmpegArgs = [];

        if (streamQuality.includes('40KBps')) {
            console.log('\n[*] 🚀 FFmpeg Mode: ULTRA-LOW BANDWIDTH (360p @ 20FPS, 200k Video, 32k Audio)...');
            ffmpegArgs = [
                '-y', '-use_wallclock_as_timestamps', '1', '-thread_queue_size', '1024',
                '-f', 'x11grab', '-draw_mouse', '0', '-video_size', '1280x720', '-framerate', '20',
                '-i', displayNum, '-thread_queue_size', '1024', '-f', 'pulse', '-i', 'default',
                '-vf', 'scale=640:360',
                '-c:v', 'libx264', '-preset', 'veryfast', '-profile:v', 'baseline',
                '-b:v', '200k', '-maxrate', '250k', '-bufsize', '500k',
                '-pix_fmt', 'yuv420p', '-g', '40',
                '-c:a', 'aac', '-b:a', '32k', '-ac', '1', '-ar', '44100',
                '-af', 'aresample=async=1', '-f', 'flv', RTMP_DESTINATION 
            ];
        } else {
            console.log('\n[*] 🚀 FFmpeg Mode: BALANCED 480p (854x480 @ 30FPS, 800k Video, 64k Audio)...');
            ffmpegArgs = [
                '-y', '-use_wallclock_as_timestamps', '1', '-thread_queue_size', '1024',
                '-f', 'x11grab', '-draw_mouse', '0', '-video_size', '1280x720', '-framerate', '30',
                '-i', displayNum, '-thread_queue_size', '1024', '-f', 'pulse', '-i', 'default',
                '-vf', 'scale=854:480',
                '-c:v', 'libx264', '-preset', 'veryfast', '-profile:v', 'main',
                '-b:v', '800k', '-maxrate', '850k', '-bufsize', '1700k',
                '-pix_fmt', 'yuv420p', '-g', '60',
                '-c:a', 'aac', '-b:a', '64k', '-ac', '2', '-ar', '44100',
                '-af', 'aresample=async=1', '-f', 'flv', RTMP_DESTINATION 
            ];
        }

        ffmpegProcess = spawn('ffmpeg', ffmpegArgs);

        let heartbeatCount = 0;
        let lastHeartbeatTime = Date.now();
        const FIVE_MINUTES = 5 * 60 * 1000;

        ffmpegProcess.stderr.on('data', (data) => {
            const output = data.toString().trim();
            if (output.includes('frame=') && output.includes('fps=')) {
                heartbeatCount++;
                const currentTime = Date.now();
                if (heartbeatCount <= 7) {
                    console.log(`[FFmpeg ${heartbeatCount}/7]: ${output.substring(0, 100)}`);
                    if (heartbeatCount === 7) console.log(`\n[✅ Success] Stream is live! Suppressing logs...`);
                } else if (currentTime - lastHeartbeatTime >= FIVE_MINUTES) {
                    console.log(`[FFmpeg 5-Min Check]: ${output.substring(0, 100)}`);
                    lastHeartbeatTime = currentTime; 
                }
            } else if (output.includes('Error') || output.includes('Failed')) {
                console.log(`\n[FFmpeg Issue]: ${output}`);
            }
        });

        ffmpegProcess.on('close', (code) => console.log(`\n[*] FFmpeg exited (Code: ${code})`));
    }

    // =========================================================================
    // 🚀 INITIAL STARTUP
    // =========================================================================
    await applyFullscreenHack();
    startBroadcast();

    // =========================================================================
    // 🧠 THE SMART WATCHDOG (Aggressive Auto-Refresh Mode)
    // =========================================================================


    // =========================================================================
    // 🧠 THE SMART WATCHDOG (Aggressive Fullscreen & Auto-Refresh Mode)
    // =========================================================================
    console.log('\n[*] Smart Engine Connected! Monitoring Video Health & Fullscreen State 24/7...');

    while (true) {
        if (!browser || !browser.isConnected()) throw new Error("Browser closed.");

        const isHealthy = await targetFrame.evaluate(() => {
            // 1. Video Element Dhoondo
            const v = document.querySelector('video[data-html5-video]') || document.querySelector('video');
            
            // Agar video nahi hai, ruki hui hai, ya khatam ho gayi hai toh direct FALSE
            if (!v || v.paused || v.ended) return false;

            // 2. NAYA CHECK: FULLSCREEN LOGIC
            // Case A: Check karega agar Native API (F11 wala) se fullscreen hai
            const isNativeFullscreen = (document.fullscreenElement === v || document.webkitFullscreenElement === v);
            
            // Case B: Check karega agar hamara "CSS Force-Stretch Hack" laga hua hai (100vw/100vh)
            const isCssFullscreen = (v.style.position === 'fixed' && v.style.width === '100vw');
            
            // Case C: Agar width poori screen ke 95% se zyada hai toh bhi usay fullscreen manega
            const isAlmostFullScreen = (v.clientWidth >= window.innerWidth * 0.95);

            // Agar in teeno mein se koi ek bhi TRUE hai, iska matlab stream full screen par sahi chal rahi hai
            const isFullscreen = isNativeFullscreen || isCssFullscreen || isAlmostFullScreen;

            return isFullscreen;
        }).catch(() => false);

        if (!isHealthy) {
            console.log('\n=================================================================');
            console.log('❌ ❌ ❌ STREAM CRASH / EXITED FULLSCREEN DETECTED! ❌ ❌ ❌');
            console.log('🛑 TRIGGERING AUTO-REFRESH PROTOCOL (Restarting in 3 Sec)...');
            console.log('=================================================================\n');
            throw new Error("Watchdog detected video exited fullscreen or stopped playing."); 
        }

        await new Promise(r => setTimeout(r, 3000)); // Har 3 second baad monitor karega
    }

}
//     console.log('\n[*] Smart Engine Connected! Monitoring Video Health 24/7...');

//     while (true) {
//         if (!browser || !browser.isConnected()) throw new Error("Browser closed.");

//         const isHealthy = await targetFrame.evaluate(() => {
//             // 🚀 PROJECT 1: Selecting the specific clappr/html5 video element
//             const v = document.querySelector('video[data-html5-video]') || document.querySelector('video');
//             // Check: video mojud ho, pause na ho, khtam na hui ho, aur ad ki wajah se choti na ho
//             return v && !v.paused && !v.ended && v.clientWidth > (window.innerWidth * 0.5);
//         }).catch(() => false);

//         if (!isHealthy) {
//             console.log('\n=================================================================');
//             console.log('❌ ❌ ❌ STREAM CRASH / AD INTERRUPT DETECTED! ❌ ❌ ❌');
//             console.log('🛑 TRIGGERING AUTO-REFRESH PROTOCOL (Restarting in 3 Sec)...');
//             console.log('=================================================================\n');
//             throw new Error("Watchdog detected bad video state."); // Yeh error catch block mein ja kar page refresh karega
//         }

//         await new Promise(r => setTimeout(r, 3000)); // Har 3 second baad monitor karega
//     }
// }

async function cleanup() {
    if (ffmpegProcess) {
        try { ffmpegProcess.stdin.end(); ffmpegProcess.kill('SIGKILL'); } catch (e) { }
        ffmpegProcess = null;
    }
    if (browser) {
        try { await browser.close(); } catch (e) { }
        browser = null;
    }
}

process.on('SIGINT', async () => {
    console.log('\n[*] Stopping live script cleanly...');
    await cleanup();
    process.exit(0);
});

mainLoop();
