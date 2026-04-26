// const puppeteer = require('puppeteer-extra');
// const StealthPlugin = require('puppeteer-extra-plugin-stealth');
// puppeteer.use(StealthPlugin());

// const { spawn, execSync } = require('child_process');
// const { PuppeteerScreenRecorder } = require('puppeteer-screen-recorder');

// // 🚀 Multi-Stream Key Manager
// const STREAM_KEYS = {
//     '1': '14601603391083_14040893622891_puxzrwjniu', 
//     '2': '14601696583275_14041072274027_apdzpdb5xi', 
//     '3': '14617940008555_14072500914795_ohw67ls7ny',
//     '4': '14601972227691_14041593547371_obdhgewlmq',
//     '5': 'YOUR_STREAM_KEY_5_HERE'
// };

// const TARGET_URL = process.env.TARGET_URL || 'https://dadocric.st/player.php?id=starsp3&v=m';
// const SELECTED_CHANNEL = process.env.OKRU_STREAM_ID || '1';
// const ACTIVE_STREAM_KEY = STREAM_KEYS[SELECTED_CHANNEL] || STREAM_KEYS['1'];

// const RTMP_SERVER = 'rtmp://vsu.okcdn.ru/input/';
// const RTMP_DESTINATION = `${RTMP_SERVER}${ACTIVE_STREAM_KEY}`;

// let browser = null;
// let ffmpegProcess = null;

// // =========================================================================
// // 🔄 MAIN LOOP
// // =========================================================================
// async function mainLoop() {
//     while (true) {
//         try {
//             await startDirectStreaming();
//         } catch (error) {
//             console.error(`\n[!] ALERT: ${error.message}`);
//             console.log('[*] 🔄 Restarting everything in 3 seconds as requested...');
//             await cleanup();
//             await new Promise(resolve => setTimeout(resolve, 3000));
//         }
//     }
// }

// async function startDirectStreaming() {
//     console.log(`[*] Starting browser and FFmpeg...`);
//     console.log(`[+] Broadcasting to OK.ru CHANNEL: ${SELECTED_CHANNEL}`);

//     const useProxy = process.env.USE_PROXY === 'ON';
//     const proxyIpPort = process.env.PROXY_IP_PORT || '31.59.20.176:6754';
//     const proxyUser = process.env.PROXY_USER || 'kexwytuq';
//     const proxyPass = process.env.PROXY_PASS || 'fw1k19a4lqfd';
    
//     const streamQuality = process.env.STREAM_QUALITY || '110KBps (Balanced 480p)';

//     const browserArgs = [
//         '--no-sandbox',
//         '--disable-setuid-sandbox',
//         '--window-size=1280,720',
//         '--kiosk', 
//         '--autoplay-policy=no-user-gesture-required'
//     ];

//     if (useProxy) {
//         browserArgs.push(`--proxy-server=http://${proxyIpPort}`);
//     }

//     browser = await puppeteer.launch({
//         channel: 'chrome',
//         headless: false, 
//         defaultViewport: { width: 1280, height: 720 },
//         ignoreDefaultArgs: ['--enable-automation'], 
//         args: browserArgs
//     });

//     const page = await browser.newPage();
//     const pages = await browser.pages();
//     for (const p of pages) {
//         if (p !== page) await p.close();
//     }

//     // Ad-Blocker Logic
//     browser.on('targetcreated', async (target) => {
//         if (target.type() === 'page') {
//             try {
//                 const newPage = await target.page();
//                 if (newPage && newPage !== page) {
//                     await page.bringToFront(); 
//                     setTimeout(() => newPage.close().catch(() => { }), 2000);
//                 }
//             } catch (e) { }
//         }
//     });

//     if (useProxy) await page.authenticate({ username: proxyUser, password: proxyPass });

//     const displayNum = process.env.DISPLAY || ':99';

//     console.log(`[*] Navigating to target URL: ${TARGET_URL}...`);
//     await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });

//     // Cloudflare Bypass wait
//     await new Promise(r => setTimeout(r, 10000));

//     let targetFrame = null;
//     for (const frame of page.frames()) {
//         try {
//             const isVideo = await frame.evaluate(() => {
//                 const vid = document.querySelector('video');
//                 return vid && vid.clientWidth > 300;
//             });
//             if (isVideo) targetFrame = frame;
//         } catch (e) { }
//     }

//     if (!targetFrame) throw new Error('Video frame not found.');

//     // Center Click for Audio
//     const viewport = page.viewport();
//     await page.mouse.click(viewport.width / 2, viewport.height / 2);
    
//     await targetFrame.evaluate(() => {
//         const v = document.querySelector('video');
//         if (v) { v.muted = false; v.volume = 1.0; v.play(); }
//     });

//     // =========================================================================
//     // 📡 FFMPEG BROADCAST (WITH HEARTBEAT LOGS)
//     // =========================================================================
//     function startBroadcast() {
//         if (ffmpegProcess) return; 
        
//         console.log('\n[*] 🚀 Launching FFmpeg with A/V Sync...');
//         const ffmpegArgs = [
//             '-y', '-use_wallclock_as_timestamps', '1', '-thread_queue_size', '1024',
//             '-f', 'x11grab', '-draw_mouse', '0', '-video_size', '1280x720', '-framerate', '30',
//             '-i', displayNum, '-thread_queue_size', '1024', '-f', 'pulse', '-i', 'default',
//             '-vf', 'scale=854:480',
//             '-c:v', 'libx264', '-preset', 'veryfast', '-profile:v', 'main',
//             '-b:v', '800k', '-maxrate', '850k', '-bufsize', '1700k',
//             '-pix_fmt', 'yuv420p', '-g', '60', '-max_muxing_queue_size', '1024',
//             '-c:a', 'aac', '-b:a', '64k', '-ac', '2', '-ar', '44100',
//             '-async', '1', '-f', 'flv', RTMP_DESTINATION 
//         ];

//         ffmpegProcess = spawn('ffmpeg', ffmpegArgs);

//         let heartbeatCount = 0;
//         let lastHeartbeatTime = Date.now();
//         const FIVE_MINUTES = 5 * 60 * 1000;

//         ffmpegProcess.stderr.on('data', (data) => {
//             const output = data.toString().trim();
            
//             // 💓 Heartbeat Logic: Pehle kuch logs dikhao, phir har 5 min baad
//             if (output.includes('frame=') && output.includes('fps=')) {
//                 heartbeatCount++;
//                 const currentTime = Date.now();
                
//                 if (heartbeatCount <= 7) {
//                     console.log(`[FFmpeg Startup ${heartbeatCount}/7]: ${output.substring(0, 80)}`);
//                     if (heartbeatCount === 7) console.log(`\n[✅ Success] Stream is live! Switching to 5-minute heartbeat mode...`);
//                 } else if (currentTime - lastHeartbeatTime >= FIVE_MINUTES) {
//                     console.log(`[💓 5-Min Heartbeat]: Stream is stable. ${output.substring(0, 80)}`);
//                     lastHeartbeatTime = currentTime; 
//                 }
//             } else if (output.includes('Error') || output.includes('Failed') || output.includes('Past duration')) {
//                 console.log(`\n[⚠️ FFmpeg Warning/Error]: ${output}`);
//             }
//         });

//         ffmpegProcess.on('close', (code) => console.log(`\n[*] FFmpeg process closed (Code: ${code})`));
//     }

//     // Privacy & Fullscreen Logic
//     async function applyPrivacyFullscreen() {
//         await page.evaluate(() => {
//             document.body.style.backgroundColor = 'black';
//             document.querySelectorAll('iframe').forEach(f => {
//                 f.style.position = 'fixed'; f.style.top = '0'; f.style.width = '100vw'; f.style.height = '100vh'; f.style.zIndex = '9999';
//             });
//         });
//         await targetFrame.evaluate(() => {
//             const v = document.querySelector('video');
//             if (v) { v.style.width = '100vw'; v.style.height = '100vh'; v.style.objectFit = 'contain'; }
//         });
//     }

//     await applyPrivacyFullscreen();
//     startBroadcast();

//     // =========================================================================
//     // 🧠 SMART WATCHDOG (Status Logs Added)
//     // =========================================================================
//     let checkCount = 0;
//     while (true) {
//         checkCount++;
//         const status = await targetFrame.evaluate(() => {
//             const v = document.querySelector('video');
//             if (!v || v.ended) return 'DEAD';
//             if (v.readyState < 2) return 'BUFFERING';
//             return 'HEALTHY';
//         }).catch(() => 'ERROR');

//         // Har 10th check (takreeban har 30 sec) par Watchdog status print karega
//         if (checkCount % 10 === 0) {
//             console.log(`[Watchdog Status]: Video is ${status}. (Checks: ${checkCount})`);
//         }

//         if (status === 'DEAD' || status === 'ERROR') throw new Error("Stream crashed or video element lost.");
        
//         if (status === 'BUFFERING') {
//             console.log("[!] Buffering detected... waiting for recovery.");
//         }

//         await new Promise(r => setTimeout(r, 3000));
//     }
// }

// async function cleanup() {
//     if (ffmpegProcess) { ffmpegProcess.kill('SIGKILL'); ffmpegProcess = null; }
//     if (browser) { await browser.close(); browser = null; }
// }

// mainLoop();






























const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const { spawn, execSync } = require('child_process');
const { PuppeteerScreenRecorder } = require('puppeteer-screen-recorder');

// 🚀 Multi-Stream Key Manager
const STREAM_KEYS = {
    '1': '14601603391083_14040893622891_puxzrwjniu', 
    '2': '14601696583275_14041072274027_apdzpdb5xi', 
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
// 🔄 MAIN LOOP
// =========================================================================
async function mainLoop() {
    while (true) {
        try {
            await startDirectStreaming();
        } catch (error) {
            console.error(`\n[!] ALERT: ${error.message}`);
            console.log('[*] 🔄 Restarting everything in 3 seconds as requested...');
            await cleanup();
            await new Promise(resolve => setTimeout(resolve, 3000));
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
        '--autoplay-policy=no-user-gesture-required' // Yeh Chrome ko baghair click ke aawaz chalane ki ijazat deta hai
    ];

    if (useProxy) {
        browserArgs.push(`--proxy-server=http://${proxyIpPort}`);
    }

    console.log(`Launching Browser on Virtual Screen with Proxy: ${useProxy ? 'ON' : 'OFF'}...`);
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
                    console.log(`[*] Adware tab detected! Forcing video tab back to foreground...`);
                    await page.bringToFront(); 
                    setTimeout(() => newPage.close().catch(() => { }), 2000);
                }
            } catch (e) { }
        }
    });

    if (useProxy) {
        await page.authenticate({ username: proxyUser, password: proxyPass });
    }

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
            const isRealLiveStream = await frame.evaluate(() => {
                const vid = document.querySelector('video[data-html5-video]') || document.querySelector('video');
                if (!vid) return false;
                if (vid.clientWidth < 300 || vid.clientHeight < 200) return false;
                return true; 
            });

            if (isRealLiveStream) {
                targetFrame = frame;
                console.log(`[+] Smart Scanner selected Real Video in frame: ${frame.url() || 'unknown'}`);
            }

            await frame.evaluate(() => {
                const floatedAd = document.getElementById('floated');
                if (floatedAd) floatedAd.remove();
            });
        } catch (e) { }
    }

    if (!targetFrame) throw new Error('No <video> element could be found.');

    // =========================================================================
    // 🔊 AUDIO UNLOCKER + UI HIDER (The Magic Fix)
    // =========================================================================
    console.log('[*] Stealth Mode: Unmuting video and hiding player UI...');
    await targetFrame.evaluate(async () => {
        // 1. CSS Injection: Player ke tamaam buttons, overlays aur unmute dabbon ko hamesha ke liye gayab kar do
        const style = document.createElement('style');
        style.innerHTML = `
            .jw-controls, .jw-ui, .plyr__controls, .vjs-control-bar, .clappr-core, 
            [data-player] .controls, .unmute-overlay, .play-overlay, button, 
            .dplayer-controller, .dplayer-notice {
                display: none !important;
                opacity: 0 !important;
                visibility: hidden !important;
                pointer-events: none !important;
            }
        `;
        document.head.appendChild(style);

        // 2. Sirf raw HTML5 video tag ko pakar kar aawaz full karo (Bina click kiye)
        const video = document.querySelector('video[data-html5-video]') || document.querySelector('video');
        if (video) {
            video.muted = false; 
            video.volume = 1.0; 
            await video.play().catch(e => {});
        }
    });

    await new Promise(r => setTimeout(r, 2000));

    // =========================================================================
    // 📡 FFMPEG BROADCAST (WITH A/V SYNC)
    // =========================================================================
    function startBroadcast() {
        if (ffmpegProcess) return; 
        
        let ffmpegArgs = [];

        if (streamQuality.includes('40KBps')) {
            console.log('\n[*] 🚀 FFmpeg Mode: ULTRA-LOW BANDWIDTH (360p @ 20FPS)...');
            ffmpegArgs = [
                '-y', '-use_wallclock_as_timestamps', '1', '-thread_queue_size', '1024',
                '-f', 'x11grab', '-draw_mouse', '0', '-video_size', '1280x720', '-framerate', '20',
                '-i', displayNum, '-thread_queue_size', '1024', '-f', 'pulse', '-i', 'default',
                '-vf', 'scale=640:360',
                '-c:v', 'libx264', '-preset', 'veryfast', '-profile:v', 'baseline',
                '-b:v', '200k', '-maxrate', '250k', '-bufsize', '500k',
                '-pix_fmt', 'yuv420p', '-g', '40', '-max_muxing_queue_size', '1024',
                '-c:a', 'aac', '-b:a', '32k', '-ac', '1', '-ar', '44100',
                '-async', '1', '-f', 'flv', RTMP_DESTINATION 
            ];
        } else {
            console.log('\n[*] 🚀 FFmpeg Mode: BALANCED 480p (854x480 @ 30FPS)...');
            ffmpegArgs = [
                '-y', '-use_wallclock_as_timestamps', '1', '-thread_queue_size', '1024',
                '-f', 'x11grab', '-draw_mouse', '0', '-video_size', '1280x720', '-framerate', '30',
                '-i', displayNum, '-thread_queue_size', '1024', '-f', 'pulse', '-i', 'default',
                '-vf', 'scale=854:480',
                '-c:v', 'libx264', '-preset', 'veryfast', '-profile:v', 'main',
                '-b:v', '800k', '-maxrate', '850k', '-bufsize', '1700k',
                '-pix_fmt', 'yuv420p', '-g', '60', '-max_muxing_queue_size', '1024',
                '-c:a', 'aac', '-b:a', '64k', '-ac', '2', '-ar', '44100',
                '-async', '1', '-f', 'flv', RTMP_DESTINATION 
            ];
        }

        ffmpegProcess = spawn('ffmpeg', ffmpegArgs);

        ffmpegProcess.stderr.on('data', (data) => {
            const output = data.toString().trim();
            if (output.includes('Error') || output.includes('Failed')) {
                console.log(`\n[FFmpeg Issue]: ${output}`);
            }
        });

        ffmpegProcess.on('close', (code) => console.log(`\n[*] FFmpeg exited (Code: ${code})`));
    }

    startBroadcast();

    // =========================================================================
    // 🧠 THE SMART WATCHDOG (Privacy 2.0 & Absolute Top Overlay)
    // =========================================================================
    console.log('\n[*] Smart Engine Connected! Monitoring Video Health & Privacy 24/7...');

    let bufferCounter = 0; 

    while (true) {
        if (!browser || !browser.isConnected()) throw new Error("Browser closed.");

        // 🛡️ STEP 1: CONSTANTLY ENFORCE MAIN PAGE PRIVACY
        await page.evaluate(() => {
            document.body.style.backgroundColor = 'black';
            document.body.style.overflow = 'hidden';
            const iframes = document.querySelectorAll('iframe');
            iframes.forEach(iframe => {
                iframe.style.position = 'fixed';
                iframe.style.top = '0';
                iframe.style.left = '0';
                iframe.style.width = '100vw';
                iframe.style.height = '100vh';
                iframe.style.zIndex = '999999'; 
                iframe.style.backgroundColor = 'black';
                iframe.style.border = 'none';
            });
        }).catch(() => {});

        // 🔍 STEP 2: CHECK VIDEO STATUS (Inside Iframe)
        const status = await targetFrame.evaluate(() => {
            const bodyText = document.body.innerText.toLowerCase();
            if (bodyText.includes("stream error") || bodyText.includes("could not be loaded")) {
                return 'CRITICAL_ERROR';
            }

            const v = document.querySelector('video[data-html5-video]') || document.querySelector('video');
            if (!v || v.ended) return 'DEAD';

            if (v.readyState < 2) return 'BUFFERING';

            // Enforce Video Stretch inside iframe
            v.style.position = 'fixed';
            v.style.top = '0';
            v.style.left = '0';
            v.style.width = '100vw';
            v.style.height = '100vh';
            v.style.zIndex = '2147483647';
            v.style.backgroundColor = 'black';
            v.style.objectFit = 'contain';

            return 'HEALTHY';
        }).catch(() => 'EVAL_ERROR');

        // 🛑 STEP 3: HANDLE BUFFERING OVERLAY ON THE MAIN PAGE
        if (status === 'BUFFERING') {
            await page.evaluate(() => {
                let overlay = document.getElementById('main-watchdog-overlay');
                if (!overlay) {
                    overlay = document.createElement('div');
                    overlay.id = 'main-watchdog-overlay';
                    overlay.innerHTML = '<h1 style="color:white; font-family:sans-serif;">Stream is buffering... Please wait!</h1>';
                    overlay.style.position = 'fixed';
                    overlay.style.top = '0';
                    overlay.style.left = '0';
                    overlay.style.width = '100vw';
                    overlay.style.height = '100vh';
                    overlay.style.backgroundColor = 'black';
                    overlay.style.zIndex = '2147483647'; 
                    overlay.style.display = 'flex';
                    overlay.style.alignItems = 'center';
                    overlay.style.justifyContent = 'center';
                    document.body.appendChild(overlay);
                }
            }).catch(() => {});

            bufferCounter++;
            console.log(`[!] Video is buffering... showing Secure Holding Screen. (${bufferCounter}/15)`);
            if (bufferCounter > 15) throw new Error("Video stuck in buffering for too long.");
        } else {
            await page.evaluate(() => {
                let existingOverlay = document.getElementById('main-watchdog-overlay');
                if (existingOverlay) existingOverlay.remove();
            }).catch(() => {});
            bufferCounter = 0; 
        }

        if (status === 'CRITICAL_ERROR' || status === 'DEAD') {
            console.log('\n[!] ❌ STREAM DEAD DETECTED! Restarting process...');
            throw new Error("Watchdog detected video dead."); 
        }

        await new Promise(r => setTimeout(r, 3000)); 
    }
}

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

// =========================================================================
// ⏱️ AUTO-OVERLAP TRIGGER (Runs exactly after 5h 50m)
// =========================================================================
setTimeout(async () => {
    console.log("\n[*] 5h 50m completed! Triggering next action for overlap...");
    const repo = process.env.GITHUB_REPOSITORY;
    const token = process.env.GH_PAT;
    const ref = process.env.GITHUB_REF_NAME || 'main';
    
    // Image ke mutabiq aapki file ka naam main.yml hai
    const workflowFileName = 'main.yml'; 

    if (!repo || !token) {
        console.log("[!] GitHub Token (GH_PAT) ya Repo data nahi mila. Auto-trigger skip kar raha hu.");
        return;
    }

    try {
        const response = await fetch(`https://api.github.com/repos/${repo}/actions/workflows/${workflowFileName}/dispatches`, {
            method: 'POST',
            headers: {
                'Accept': 'application/vnd.github.v3+json',
                'Authorization': `token ${token}`
            },
            body: JSON.stringify({
                ref: ref,
                inputs: {
                    target_url: process.env.TARGET_URL,
                    okru_stream_channel: process.env.OKRU_STREAM_ID,
                    use_proxy: process.env.USE_PROXY,
                    stream_quality: process.env.STREAM_QUALITY
                }
            })
        });

        if (response.ok) {
            console.log("[+] Next workflow run successfully triggered!");
        } else {
            const errTxt = await response.text();
            console.error("[-] GitHub API responded with error:", response.status, errTxt);
        }
    } catch (err) {
        console.error("[-] Failed to trigger next workflow:", err);
    }
}, 21000000); // 21,000,000 ms = exactly 5 Hours & 50 Minutes

mainLoop();































// 2 , opper yeh GH_PAT wala token add kya hai aab poraa 24 hour chalegaa inshallah


// const puppeteer = require('puppeteer-extra');
// const StealthPlugin = require('puppeteer-extra-plugin-stealth');
// puppeteer.use(StealthPlugin());

// const { spawn, execSync } = require('child_process');
// const { PuppeteerScreenRecorder } = require('puppeteer-screen-recorder');

// // 🚀 Multi-Stream Key Manager
// const STREAM_KEYS = {
//     '1': '14601603391083_14040893622891_puxzrwjniu', 
//     '2': '14601696583275_14041072274027_apdzpdb5xi', 
//     '3': '14617940008555_14072500914795_ohw67ls7ny',
//     '4': '14601972227691_14041593547371_obdhgewlmq',
//     '5': 'YOUR_STREAM_KEY_5_HERE'
// };

// const TARGET_URL = process.env.TARGET_URL || 'https://dadocric.st/player.php?id=starsp3&v=m';
// const SELECTED_CHANNEL = process.env.OKRU_STREAM_ID || '1';
// const ACTIVE_STREAM_KEY = STREAM_KEYS[SELECTED_CHANNEL] || STREAM_KEYS['1'];

// const RTMP_SERVER = 'rtmp://vsu.okcdn.ru/input/';
// const RTMP_DESTINATION = `${RTMP_SERVER}${ACTIVE_STREAM_KEY}`;

// let browser = null;
// let ffmpegProcess = null;

// // =========================================================================
// // 🔄 MAIN LOOP
// // =========================================================================
// async function mainLoop() {
//     while (true) {
//         try {
//             await startDirectStreaming();
//         } catch (error) {
//             console.error(`\n[!] ALERT: ${error.message}`);
//             console.log('[*] 🔄 Restarting everything in 3 seconds as requested...');
//             await cleanup();
//             await new Promise(resolve => setTimeout(resolve, 3000));
//         }
//     }
// }

// async function startDirectStreaming() {
//     console.log(`[*] Starting browser and FFmpeg...`);
//     console.log(`[+] Broadcasting to OK.ru CHANNEL: ${SELECTED_CHANNEL}`);

//     const useProxy = process.env.USE_PROXY === 'ON';
//     const proxyIpPort = process.env.PROXY_IP_PORT || '31.59.20.176:6754';
//     const proxyUser = process.env.PROXY_USER || 'kexwytuq';
//     const proxyPass = process.env.PROXY_PASS || 'fw1k19a4lqfd';
    
//     const streamQuality = process.env.STREAM_QUALITY || '110KBps (Balanced 480p)';

//     const browserArgs = [
//         '--no-sandbox',
//         '--disable-setuid-sandbox',
//         '--window-size=1280,720',
//         '--kiosk', 
//         '--autoplay-policy=no-user-gesture-required' // Yeh Chrome ko baghair click ke aawaz chalane ki ijazat deta hai
//     ];

//     if (useProxy) {
//         browserArgs.push(`--proxy-server=http://${proxyIpPort}`);
//     }

//     console.log(`Launching Browser on Virtual Screen with Proxy: ${useProxy ? 'ON' : 'OFF'}...`);
//     browser = await puppeteer.launch({
//         channel: 'chrome',
//         headless: false, 
//         defaultViewport: { width: 1280, height: 720 },
//         ignoreDefaultArgs: ['--enable-automation'], 
//         args: browserArgs
//     });

//     const page = await browser.newPage();
//     const pages = await browser.pages();
//     for (const p of pages) {
//         if (p !== page) await p.close();
//     }

//     // Aggressive Ad-Popup Blocker
//     browser.on('targetcreated', async (target) => {
//         if (target.type() === 'page') {
//             try {
//                 const newPage = await target.page();
//                 if (newPage && newPage !== page) {
//                     console.log(`[*] Adware tab detected! Forcing video tab back to foreground...`);
//                     await page.bringToFront(); 
//                     setTimeout(() => newPage.close().catch(() => { }), 2000);
//                 }
//             } catch (e) { }
//         }
//     });

//     if (useProxy) {
//         await page.authenticate({ username: proxyUser, password: proxyPass });
//     }

//     const displayNum = process.env.DISPLAY || ':99';

//     console.log(`[*] Navigating to target URL: ${TARGET_URL}...`);
//     await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });

//     console.log('[*] Waiting for potential Cloudflare...');
//     for (let i = 0; i < 15; i++) {
//         const title = await page.title();
//         if (!title.includes('Moment') && !title.includes('Cloudflare')) break;
//         await new Promise(r => setTimeout(r, 1000));
//     }

//     await new Promise(resolve => setTimeout(resolve, 8000));

//     // =========================================================================
//     // 🧠 THE SMART SCANNER & CLEANER 
//     // =========================================================================
//     let targetFrame = null;
//     console.log('[*] Scanning iframes for the REAL Live Stream Video...');
//     for (const frame of page.frames()) {
//         try {
//             const isRealLiveStream = await frame.evaluate(() => {
//                 const vid = document.querySelector('video[data-html5-video]') || document.querySelector('video');
//                 if (!vid) return false;
//                 if (vid.clientWidth < 300 || vid.clientHeight < 200) return false;
//                 return true; 
//             });

//             if (isRealLiveStream) {
//                 targetFrame = frame;
//                 console.log(`[+] Smart Scanner selected Real Video in frame: ${frame.url() || 'unknown'}`);
//             }

//             await frame.evaluate(() => {
//                 const floatedAd = document.getElementById('floated');
//                 if (floatedAd) floatedAd.remove();
//             });
//         } catch (e) { }
//     }

//     if (!targetFrame) throw new Error('No <video> element could be found.');

//     // =========================================================================
//     // 🔊 AUDIO UNLOCKER + UI HIDER (The Magic Fix)
//     // =========================================================================
//     console.log('[*] Stealth Mode: Unmuting video and hiding player UI...');
//     await targetFrame.evaluate(async () => {
//         // 1. CSS Injection: Player ke tamaam buttons, overlays aur unmute dabbon ko hamesha ke liye gayab kar do
//         const style = document.createElement('style');
//         style.innerHTML = `
//             .jw-controls, .jw-ui, .plyr__controls, .vjs-control-bar, .clappr-core, 
//             [data-player] .controls, .unmute-overlay, .play-overlay, button, 
//             .dplayer-controller, .dplayer-notice {
//                 display: none !important;
//                 opacity: 0 !important;
//                 visibility: hidden !important;
//                 pointer-events: none !important;
//             }
//         `;
//         document.head.appendChild(style);

//         // 2. Sirf raw HTML5 video tag ko pakar kar aawaz full karo (Bina click kiye)
//         const video = document.querySelector('video[data-html5-video]') || document.querySelector('video');
//         if (video) {
//             video.muted = false; 
//             video.volume = 1.0; 
//             await video.play().catch(e => {});
//         }
//     });

//     await new Promise(r => setTimeout(r, 2000));

//     // =========================================================================
//     // 📡 FFMPEG BROADCAST (WITH A/V SYNC)
//     // =========================================================================
//     function startBroadcast() {
//         if (ffmpegProcess) return; 
        
//         let ffmpegArgs = [];

//         if (streamQuality.includes('40KBps')) {
//             console.log('\n[*] 🚀 FFmpeg Mode: ULTRA-LOW BANDWIDTH (360p @ 20FPS)...');
//             ffmpegArgs = [
//                 '-y', '-use_wallclock_as_timestamps', '1', '-thread_queue_size', '1024',
//                 '-f', 'x11grab', '-draw_mouse', '0', '-video_size', '1280x720', '-framerate', '20',
//                 '-i', displayNum, '-thread_queue_size', '1024', '-f', 'pulse', '-i', 'default',
//                 '-vf', 'scale=640:360',
//                 '-c:v', 'libx264', '-preset', 'veryfast', '-profile:v', 'baseline',
//                 '-b:v', '200k', '-maxrate', '250k', '-bufsize', '500k',
//                 '-pix_fmt', 'yuv420p', '-g', '40', '-max_muxing_queue_size', '1024',
//                 '-c:a', 'aac', '-b:a', '32k', '-ac', '1', '-ar', '44100',
//                 '-async', '1', '-f', 'flv', RTMP_DESTINATION 
//             ];
//         } else {
//             console.log('\n[*] 🚀 FFmpeg Mode: BALANCED 480p (854x480 @ 30FPS)...');
//             ffmpegArgs = [
//                 '-y', '-use_wallclock_as_timestamps', '1', '-thread_queue_size', '1024',
//                 '-f', 'x11grab', '-draw_mouse', '0', '-video_size', '1280x720', '-framerate', '30',
//                 '-i', displayNum, '-thread_queue_size', '1024', '-f', 'pulse', '-i', 'default',
//                 '-vf', 'scale=854:480',
//                 '-c:v', 'libx264', '-preset', 'veryfast', '-profile:v', 'main',
//                 '-b:v', '800k', '-maxrate', '850k', '-bufsize', '1700k',
//                 '-pix_fmt', 'yuv420p', '-g', '60', '-max_muxing_queue_size', '1024',
//                 '-c:a', 'aac', '-b:a', '64k', '-ac', '2', '-ar', '44100',
//                 '-async', '1', '-f', 'flv', RTMP_DESTINATION 
//             ];
//         }

//         ffmpegProcess = spawn('ffmpeg', ffmpegArgs);

//         ffmpegProcess.stderr.on('data', (data) => {
//             const output = data.toString().trim();
//             if (output.includes('Error') || output.includes('Failed')) {
//                 console.log(`\n[FFmpeg Issue]: ${output}`);
//             }
//         });

//         ffmpegProcess.on('close', (code) => console.log(`\n[*] FFmpeg exited (Code: ${code})`));
//     }

//     startBroadcast();

//     // =========================================================================
//     // 🧠 THE SMART WATCHDOG (Privacy 2.0 & Absolute Top Overlay)
//     // =========================================================================
//     console.log('\n[*] Smart Engine Connected! Monitoring Video Health & Privacy 24/7...');

//     let bufferCounter = 0; 

//     while (true) {
//         if (!browser || !browser.isConnected()) throw new Error("Browser closed.");

//         // 🛡️ STEP 1: CONSTANTLY ENFORCE MAIN PAGE PRIVACY
//         await page.evaluate(() => {
//             document.body.style.backgroundColor = 'black';
//             document.body.style.overflow = 'hidden';
//             const iframes = document.querySelectorAll('iframe');
//             iframes.forEach(iframe => {
//                 iframe.style.position = 'fixed';
//                 iframe.style.top = '0';
//                 iframe.style.left = '0';
//                 iframe.style.width = '100vw';
//                 iframe.style.height = '100vh';
//                 iframe.style.zIndex = '999999'; 
//                 iframe.style.backgroundColor = 'black';
//                 iframe.style.border = 'none';
//             });
//         }).catch(() => {});

//         // 🔍 STEP 2: CHECK VIDEO STATUS (Inside Iframe)
//         const status = await targetFrame.evaluate(() => {
//             const bodyText = document.body.innerText.toLowerCase();
//             if (bodyText.includes("stream error") || bodyText.includes("could not be loaded")) {
//                 return 'CRITICAL_ERROR';
//             }

//             const v = document.querySelector('video[data-html5-video]') || document.querySelector('video');
//             if (!v || v.ended) return 'DEAD';

//             if (v.readyState < 2) return 'BUFFERING';

//             // Enforce Video Stretch inside iframe
//             v.style.position = 'fixed';
//             v.style.top = '0';
//             v.style.left = '0';
//             v.style.width = '100vw';
//             v.style.height = '100vh';
//             v.style.zIndex = '2147483647';
//             v.style.backgroundColor = 'black';
//             v.style.objectFit = 'contain';

//             return 'HEALTHY';
//         }).catch(() => 'EVAL_ERROR');

//         // 🛑 STEP 3: HANDLE BUFFERING OVERLAY ON THE MAIN PAGE
//         if (status === 'BUFFERING') {
//             await page.evaluate(() => {
//                 let overlay = document.getElementById('main-watchdog-overlay');
//                 if (!overlay) {
//                     overlay = document.createElement('div');
//                     overlay.id = 'main-watchdog-overlay';
//                     overlay.innerHTML = '<h1 style="color:white; font-family:sans-serif;">Stream is buffering... Please wait!</h1>';
//                     overlay.style.position = 'fixed';
//                     overlay.style.top = '0';
//                     overlay.style.left = '0';
//                     overlay.style.width = '100vw';
//                     overlay.style.height = '100vh';
//                     overlay.style.backgroundColor = 'black';
//                     overlay.style.zIndex = '2147483647'; 
//                     overlay.style.display = 'flex';
//                     overlay.style.alignItems = 'center';
//                     overlay.style.justifyContent = 'center';
//                     document.body.appendChild(overlay);
//                 }
//             }).catch(() => {});

//             bufferCounter++;
//             console.log(`[!] Video is buffering... showing Secure Holding Screen. (${bufferCounter}/15)`);
//             if (bufferCounter > 15) throw new Error("Video stuck in buffering for too long.");
//         } else {
//             await page.evaluate(() => {
//                 let existingOverlay = document.getElementById('main-watchdog-overlay');
//                 if (existingOverlay) existingOverlay.remove();
//             }).catch(() => {});
//             bufferCounter = 0; 
//         }

//         if (status === 'CRITICAL_ERROR' || status === 'DEAD') {
//             console.log('\n[!] ❌ STREAM DEAD DETECTED! Restarting process...');
//             throw new Error("Watchdog detected video dead."); 
//         }

//         await new Promise(r => setTimeout(r, 3000)); 
//     }
// }

// async function cleanup() {
//     if (ffmpegProcess) {
//         try { ffmpegProcess.stdin.end(); ffmpegProcess.kill('SIGKILL'); } catch (e) { }
//         ffmpegProcess = null;
//     }
//     if (browser) {
//         try { await browser.close(); } catch (e) { }
//         browser = null;
//     }
// }

// process.on('SIGINT', async () => {
//     console.log('\n[*] Stopping live script cleanly...');
//     await cleanup();
//     process.exit(0);
// });

// mainLoop();























// const puppeteer = require('puppeteer-extra');
// const StealthPlugin = require('puppeteer-extra-plugin-stealth');
// puppeteer.use(StealthPlugin());

// const { spawn, execSync } = require('child_process');
// const { PuppeteerScreenRecorder } = require('puppeteer-screen-recorder');

// // 🚀 Multi-Stream Key Manager
// const STREAM_KEYS = {
//     '1': '14601603391083_14040893622891_puxzrwjniu', 
//     '2': '14601696583275_14041072274027_apdzpdb5xi', 
//     '3': '14617940008555_14072500914795_ohw67ls7ny',
//     '4': '14601972227691_14041593547371_obdhgewlmq',
//     '5': 'YOUR_STREAM_KEY_5_HERE'
// };

// const TARGET_URL = process.env.TARGET_URL || 'https://dadocric.st/player.php?id=starsp3&v=m';
// const SELECTED_CHANNEL = process.env.OKRU_STREAM_ID || '1';
// const ACTIVE_STREAM_KEY = STREAM_KEYS[SELECTED_CHANNEL] || STREAM_KEYS['1'];

// const RTMP_SERVER = 'rtmp://vsu.okcdn.ru/input/';
// const RTMP_DESTINATION = `${RTMP_SERVER}${ACTIVE_STREAM_KEY}`;

// let browser = null;
// let ffmpegProcess = null;

// // =========================================================================
// // 🔄 MAIN LOOP
// // =========================================================================
// async function mainLoop() {
//     while (true) {
//         try {
//             await startDirectStreaming();
//         } catch (error) {
//             console.error(`\n[!] ALERT: ${error.message}`);
//             console.log('[*] 🔄 Restarting everything in 3 seconds as requested...');
//             await cleanup();
//             await new Promise(resolve => setTimeout(resolve, 3000));
//         }
//     }
// }

// async function startDirectStreaming() {
//     console.log(`[*] Starting browser and FFmpeg...`);
//     console.log(`[+] Broadcasting to OK.ru CHANNEL: ${SELECTED_CHANNEL}`);

//     const useProxy = process.env.USE_PROXY === 'ON';
//     const proxyIpPort = process.env.PROXY_IP_PORT || '31.59.20.176:6754';
//     const proxyUser = process.env.PROXY_USER || 'kexwytuq';
//     const proxyPass = process.env.PROXY_PASS || 'fw1k19a4lqfd';
    
//     const streamQuality = process.env.STREAM_QUALITY || '110KBps (Balanced 480p)';

//     const browserArgs = [
//         '--no-sandbox',
//         '--disable-setuid-sandbox',
//         '--window-size=1280,720',
//         '--kiosk', 
//         '--autoplay-policy=no-user-gesture-required'
//     ];

//     if (useProxy) {
//         browserArgs.push(`--proxy-server=http://${proxyIpPort}`);
//     }

//     console.log(`Launching Browser on Virtual Screen with Proxy: ${useProxy ? 'ON' : 'OFF'}...`);
//     browser = await puppeteer.launch({
//         channel: 'chrome',
//         headless: false, 
//         defaultViewport: { width: 1280, height: 720 },
//         ignoreDefaultArgs: ['--enable-automation'], 
//         args: browserArgs
//     });

//     const page = await browser.newPage();
//     const pages = await browser.pages();
//     for (const p of pages) {
//         if (p !== page) await p.close();
//     }

//     // Aggressive Ad-Popup Blocker
//     browser.on('targetcreated', async (target) => {
//         if (target.type() === 'page') {
//             try {
//                 const newPage = await target.page();
//                 if (newPage && newPage !== page) {
//                     console.log(`[*] Adware tab detected! Forcing video tab back to foreground...`);
//                     await page.bringToFront(); 
//                     setTimeout(() => newPage.close().catch(() => { }), 2000);
//                 }
//             } catch (e) { }
//         }
//     });

//     if (useProxy) {
//         await page.authenticate({ username: proxyUser, password: proxyPass });
//     }

//     const displayNum = process.env.DISPLAY || ':99';

//     console.log(`[*] Navigating to target URL: ${TARGET_URL}...`);
//     await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });

//     console.log('[*] Waiting for potential Cloudflare...');
//     for (let i = 0; i < 15; i++) {
//         const title = await page.title();
//         if (!title.includes('Moment') && !title.includes('Cloudflare')) break;
//         await new Promise(r => setTimeout(r, 1000));
//     }

//     await new Promise(resolve => setTimeout(resolve, 8000));

//     // =========================================================================
//     // 🧠 THE SMART SCANNER & CLEANER 
//     // =========================================================================
//     let targetFrame = null;
//     console.log('[*] Scanning iframes for the REAL Live Stream Video...');
//     for (const frame of page.frames()) {
//         try {
//             const isRealLiveStream = await frame.evaluate(() => {
//                 const vid = document.querySelector('video[data-html5-video]') || document.querySelector('video');
//                 if (!vid) return false;
//                 if (vid.clientWidth < 300 || vid.clientHeight < 200) return false;
//                 return true; 
//             });

//             if (isRealLiveStream) {
//                 targetFrame = frame;
//                 console.log(`[+] Smart Scanner selected Real Video in frame: ${frame.url() || 'unknown'}`);
//             }

//             await frame.evaluate(() => {
//                 const floatedAd = document.getElementById('floated');
//                 if (floatedAd) floatedAd.remove();
//             });
//         } catch (e) { }
//     }

//     if (!targetFrame) throw new Error('No <video> element could be found.');

//     // =========================================================================
//     // 🔊 AUDIO UNLOCKER: The Center Click
//     // =========================================================================
//     console.log('[*] Applying Physical Center Click to register User Action for Audio...');
//     try {
//         const viewport = page.viewport();
//         const centerX = viewport ? viewport.width / 2 : 1280 / 2;
//         const centerY = viewport ? viewport.height / 2 : 720 / 2;
//         await page.mouse.click(centerX, centerY, { delay: 100 });
//         await new Promise(r => setTimeout(r, 2000));
//     } catch (e) {
//         console.log('[!] Center click failed: ', e.message);
//     }

//     console.log('[*] Executing JS Unmute & Volume Max logic...');
//     await targetFrame.evaluate(async () => {
//         const video = document.querySelector('video[data-html5-video]') || document.querySelector('video');
//         if (video) {
//             video.muted = false; 
//             video.volume = 1.0; 
//             await video.play().catch(e => {});
//         }
//     });

//     // =========================================================================
//     // 📡 FFMPEG BROADCAST (WITH A/V SYNC)
//     // =========================================================================
//     function startBroadcast() {
//         if (ffmpegProcess) return; 
        
//         let ffmpegArgs = [];

//         if (streamQuality.includes('40KBps')) {
//             console.log('\n[*] 🚀 FFmpeg Mode: ULTRA-LOW BANDWIDTH (360p @ 20FPS)...');
//             ffmpegArgs = [
//                 '-y', '-use_wallclock_as_timestamps', '1', '-thread_queue_size', '1024',
//                 '-f', 'x11grab', '-draw_mouse', '0', '-video_size', '1280x720', '-framerate', '20',
//                 '-i', displayNum, '-thread_queue_size', '1024', '-f', 'pulse', '-i', 'default',
//                 '-vf', 'scale=640:360',
//                 '-c:v', 'libx264', '-preset', 'veryfast', '-profile:v', 'baseline',
//                 '-b:v', '200k', '-maxrate', '250k', '-bufsize', '500k',
//                 '-pix_fmt', 'yuv420p', '-g', '40', '-max_muxing_queue_size', '1024',
//                 '-c:a', 'aac', '-b:a', '32k', '-ac', '1', '-ar', '44100',
//                 '-async', '1', '-f', 'flv', RTMP_DESTINATION 
//             ];
//         } else {
//             console.log('\n[*] 🚀 FFmpeg Mode: BALANCED 480p (854x480 @ 30FPS)...');
//             ffmpegArgs = [
//                 '-y', '-use_wallclock_as_timestamps', '1', '-thread_queue_size', '1024',
//                 '-f', 'x11grab', '-draw_mouse', '0', '-video_size', '1280x720', '-framerate', '30',
//                 '-i', displayNum, '-thread_queue_size', '1024', '-f', 'pulse', '-i', 'default',
//                 '-vf', 'scale=854:480',
//                 '-c:v', 'libx264', '-preset', 'veryfast', '-profile:v', 'main',
//                 '-b:v', '800k', '-maxrate', '850k', '-bufsize', '1700k',
//                 '-pix_fmt', 'yuv420p', '-g', '60', '-max_muxing_queue_size', '1024',
//                 '-c:a', 'aac', '-b:a', '64k', '-ac', '2', '-ar', '44100',
//                 '-async', '1', '-f', 'flv', RTMP_DESTINATION 
//             ];
//         }

//         ffmpegProcess = spawn('ffmpeg', ffmpegArgs);

//         ffmpegProcess.stderr.on('data', (data) => {
//             const output = data.toString().trim();
//             if (output.includes('Error') || output.includes('Failed')) {
//                 console.log(`\n[FFmpeg Issue]: ${output}`);
//             }
//         });

//         ffmpegProcess.on('close', (code) => console.log(`\n[*] FFmpeg exited (Code: ${code})`));
//     }

//     startBroadcast();

//     // =========================================================================
//     // 🧠 THE SMART WATCHDOG (Privacy 2.0 & Absolute Top Overlay)
//     // =========================================================================
//     console.log('\n[*] Smart Engine Connected! Monitoring Video Health & Privacy 24/7...');

//     let bufferCounter = 0; 

//     while (true) {
//         if (!browser || !browser.isConnected()) throw new Error("Browser closed.");

//         // 🛡️ STEP 1: CONSTANTLY ENFORCE MAIN PAGE PRIVACY
//         // Yeh ensure karega ke main website ki koi bhi cheez screen par na aaye
//         await page.evaluate(() => {
//             document.body.style.backgroundColor = 'black';
//             document.body.style.overflow = 'hidden';
//             const iframes = document.querySelectorAll('iframe');
//             iframes.forEach(iframe => {
//                 iframe.style.position = 'fixed';
//                 iframe.style.top = '0';
//                 iframe.style.left = '0';
//                 iframe.style.width = '100vw';
//                 iframe.style.height = '100vh';
//                 iframe.style.zIndex = '999999'; // Very High Z-Index
//                 iframe.style.backgroundColor = 'black';
//                 iframe.style.border = 'none';
//             });
//         }).catch(() => {});

//         // 🔍 STEP 2: CHECK VIDEO STATUS (Inside Iframe)
//         const status = await targetFrame.evaluate(() => {
//             const bodyText = document.body.innerText.toLowerCase();
//             if (bodyText.includes("stream error") || bodyText.includes("could not be loaded")) {
//                 return 'CRITICAL_ERROR';
//             }

//             const v = document.querySelector('video[data-html5-video]') || document.querySelector('video');
//             if (!v || v.ended) return 'DEAD';

//             // Buffering check
//             if (v.readyState < 2) return 'BUFFERING';

//             // Enforce Video Stretch inside iframe (Hide unmute UI etc.)
//             v.style.position = 'fixed';
//             v.style.top = '0';
//             v.style.left = '0';
//             v.style.width = '100vw';
//             v.style.height = '100vh';
//             v.style.zIndex = '2147483647';
//             v.style.backgroundColor = 'black';
//             v.style.objectFit = 'contain';

//             return 'HEALTHY';
//         }).catch(() => 'EVAL_ERROR');

//         // 🛑 STEP 3: HANDLE BUFFERING OVERLAY ON THE MAIN PAGE (Not Iframe)
//         if (status === 'BUFFERING') {
//             await page.evaluate(() => {
//                 let overlay = document.getElementById('main-watchdog-overlay');
//                 if (!overlay) {
//                     overlay = document.createElement('div');
//                     overlay.id = 'main-watchdog-overlay';
//                     overlay.innerHTML = '<h1 style="color:white; font-family:sans-serif;">Stream is buffering... Please wait!</h1>';
//                     overlay.style.position = 'fixed';
//                     overlay.style.top = '0';
//                     overlay.style.left = '0';
//                     overlay.style.width = '100vw';
//                     overlay.style.height = '100vh';
//                     overlay.style.backgroundColor = 'black';
//                     overlay.style.zIndex = '2147483647'; // ABSOLUTE MAX Z-INDEX ON ENTIRE BROWSER
//                     overlay.style.display = 'flex';
//                     overlay.style.alignItems = 'center';
//                     overlay.style.justifyContent = 'center';
//                     document.body.appendChild(overlay);
//                 }
//             }).catch(() => {});

//             bufferCounter++;
//             console.log(`[!] Video is buffering... showing Secure Holding Screen. (${bufferCounter}/15)`);
//             if (bufferCounter > 15) throw new Error("Video stuck in buffering for too long.");
//         } else {
//             // Agar video chal rahi hai toh main page se overlay hata do
//             await page.evaluate(() => {
//                 let existingOverlay = document.getElementById('main-watchdog-overlay');
//                 if (existingOverlay) existingOverlay.remove();
//             }).catch(() => {});
//             bufferCounter = 0; 
//         }

//         if (status === 'CRITICAL_ERROR' || status === 'DEAD') {
//             console.log('\n[!] ❌ STREAM DEAD DETECTED! Restarting process...');
//             throw new Error("Watchdog detected video dead."); 
//         }

//         await new Promise(r => setTimeout(r, 3000)); 
//     }
// }

// async function cleanup() {
//     if (ffmpegProcess) {
//         try { ffmpegProcess.stdin.end(); ffmpegProcess.kill('SIGKILL'); } catch (e) { }
//         ffmpegProcess = null;
//     }
//     if (browser) {
//         try { await browser.close(); } catch (e) { }
//         browser = null;
//     }
// }

// process.on('SIGINT', async () => {
//     console.log('\n[*] Stopping live script cleanly...');
//     await cleanup();
//     process.exit(0);
// });

// mainLoop();
















// 1


// const puppeteer = require('puppeteer-extra');
// const StealthPlugin = require('puppeteer-extra-plugin-stealth');
// puppeteer.use(StealthPlugin());

// const { spawn, execSync } = require('child_process');
// const { PuppeteerScreenRecorder } = require('puppeteer-screen-recorder');

// // 🚀 Multi-Stream Key Manager
// const STREAM_KEYS = {
//     '1': '14601603391083_14040893622891_puxzrwjniu', 
//     '2': '14601696583275_14041072274027_apdzpdb5xi', 
//     '3': '14617940008555_14072500914795_ohw67ls7ny',
//     '4': '14601972227691_14041593547371_obdhgewlmq',
//     '5': 'YOUR_STREAM_KEY_5_HERE'
// };

// const TARGET_URL = process.env.TARGET_URL || 'https://dadocric.st/player.php?id=starsp3&v=m';
// const SELECTED_CHANNEL = process.env.OKRU_STREAM_ID || '1';
// const ACTIVE_STREAM_KEY = STREAM_KEYS[SELECTED_CHANNEL] || STREAM_KEYS['1'];

// const RTMP_SERVER = 'rtmp://vsu.okcdn.ru/input/';
// const RTMP_DESTINATION = `${RTMP_SERVER}${ACTIVE_STREAM_KEY}`;

// let browser = null;
// let ffmpegProcess = null;

// // =========================================================================
// // 🔄 MAIN LOOP
// // =========================================================================
// async function mainLoop() {
//     while (true) {
//         try {
//             await startDirectStreaming();
//         } catch (error) {
//             console.error(`\n[!] ALERT: ${error.message}`);
//             console.log('[*] 🔄 Restarting everything in 3 seconds as requested...');
//             await cleanup();
//             await new Promise(resolve => setTimeout(resolve, 3000));
//         }
//     }
// }

// async function startDirectStreaming() {
//     console.log(`[*] Starting browser and FFmpeg...`);
//     console.log(`[+] Broadcasting to OK.ru CHANNEL: ${SELECTED_CHANNEL}`);

//     const useProxy = process.env.USE_PROXY === 'ON';
//     const proxyIpPort = process.env.PROXY_IP_PORT || '31.59.20.176:6754';
//     const proxyUser = process.env.PROXY_USER || 'kexwytuq';
//     const proxyPass = process.env.PROXY_PASS || 'fw1k19a4lqfd';
    
//     const streamQuality = process.env.STREAM_QUALITY || '110KBps (Balanced 480p)';

//     const browserArgs = [
//         '--no-sandbox',
//         '--disable-setuid-sandbox',
//         '--window-size=1280,720',
//         '--kiosk', 
//         '--autoplay-policy=no-user-gesture-required'
//     ];

//     if (useProxy) {
//         browserArgs.push(`--proxy-server=http://${proxyIpPort}`);
//     }

//     console.log(`Launching Browser on Virtual Screen with Proxy: ${useProxy ? 'ON' : 'OFF'}...`);
//     browser = await puppeteer.launch({
//         channel: 'chrome',
//         headless: false, 
//         defaultViewport: { width: 1280, height: 720 },
//         ignoreDefaultArgs: ['--enable-automation'], 
//         args: browserArgs
//     });

//     const page = await browser.newPage();
//     const pages = await browser.pages();
//     for (const p of pages) {
//         if (p !== page) await p.close();
//     }

//     // Aggressive Ad-Popup Blocker
//     browser.on('targetcreated', async (target) => {
//         if (target.type() === 'page') {
//             try {
//                 const newPage = await target.page();
//                 if (newPage && newPage !== page) {
//                     console.log(`[*] Adware tab detected! Forcing video tab back to foreground...`);
//                     await page.bringToFront(); 
//                     setTimeout(() => newPage.close().catch(() => { }), 2000);
//                 }
//             } catch (e) { }
//         }
//     });

//     if (useProxy) {
//         await page.authenticate({ username: proxyUser, password: proxyPass });
//     }

//     const displayNum = process.env.DISPLAY || ':99';

//     console.log(`[*] Navigating to target URL: ${TARGET_URL}...`);
//     await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });

//     console.log('[*] Waiting for potential Cloudflare...');
//     for (let i = 0; i < 15; i++) {
//         const title = await page.title();
//         if (!title.includes('Moment') && !title.includes('Cloudflare')) break;
//         await new Promise(r => setTimeout(r, 1000));
//     }

//     await new Promise(resolve => setTimeout(resolve, 8000));

//     // =========================================================================
//     // 🧠 THE SMART SCANNER & CLEANER 
//     // =========================================================================
//     let targetFrame = null;
//     console.log('[*] Scanning iframes for the REAL Live Stream Video...');
//     for (const frame of page.frames()) {
//         try {
//             const isRealLiveStream = await frame.evaluate(() => {
//                 const vid = document.querySelector('video[data-html5-video]') || document.querySelector('video');
//                 if (!vid) return false;
//                 if (vid.clientWidth < 300 || vid.clientHeight < 200) return false;
//                 return true; 
//             });

//             if (isRealLiveStream) {
//                 targetFrame = frame;
//                 console.log(`[+] Smart Scanner selected Real Video in frame: ${frame.url() || 'unknown'}`);
//             }

//             await frame.evaluate(() => {
//                 const floatedAd = document.getElementById('floated');
//                 if (floatedAd) floatedAd.remove();
//             });
//         } catch (e) { }
//     }

//     if (!targetFrame) throw new Error('No <video> element could be found.');

//     // =========================================================================
//     // 🔊 AUDIO UNLOCKER: The Center Click
//     // =========================================================================
//     console.log('[*] Applying Physical Center Click to register User Action for Audio...');
//     try {
//         const viewport = page.viewport();
//         const centerX = viewport ? viewport.width / 2 : 1280 / 2;
//         const centerY = viewport ? viewport.height / 2 : 720 / 2;
//         await page.mouse.click(centerX, centerY, { delay: 100 });
//         await new Promise(r => setTimeout(r, 2000));
//     } catch (e) {
//         console.log('[!] Center click failed: ', e.message);
//     }

//     console.log('[*] Executing JS Unmute & Volume Max logic...');
//     await targetFrame.evaluate(async () => {
//         const video = document.querySelector('video[data-html5-video]') || document.querySelector('video');
//         if (video) {
//             video.muted = false; 
//             video.volume = 1.0; 
//             await video.play().catch(e => {});
//         }
//     });

//     // =========================================================================
//     // 🛠️ REUSABLE FUNCTIONS & PRIVACY HACK
//     // =========================================================================
//     async function applyFullscreenHack() {
//         console.log('\n[*] Executing Privacy & Fullscreen Script...');
        
//         await page.evaluate(() => {
//             document.body.style.overflow = 'hidden'; // Scroll bar khatam
//             document.body.style.backgroundColor = 'black'; // Background purely black
//             const iframes = document.querySelectorAll('iframe');
//             iframes.forEach(iframe => {
//                 iframe.style.position = 'fixed';
//                 iframe.style.top = '0';
//                 iframe.style.left = '0';
//                 iframe.style.width = '100vw';
//                 iframe.style.height = '100vh';
//                 iframe.style.zIndex = '2147483647';
//                 iframe.style.backgroundColor = 'black';
//             });
//         });

//         await targetFrame.evaluate(async () => {
//             const vid = document.querySelector('video[data-html5-video]') || document.querySelector('video');
//             if (!vid) return;
//             try {
//                 if (vid.requestFullscreen) await vid.requestFullscreen();
//                 else if (vid.webkitRequestFullscreen) await vid.webkitRequestFullscreen();
//             } catch (err) {
//                 vid.style.position = 'fixed';
//                 vid.style.top = '0';
//                 vid.style.left = '0';
//                 vid.style.width = '100vw';
//                 vid.style.height = '100vh';
//                 vid.style.zIndex = '2147483647';
//                 vid.style.backgroundColor = 'black';
//                 vid.style.objectFit = 'contain';
//             }
//         });
//         await new Promise(r => setTimeout(r, 2000));
//     }

//     // =========================================================================
//     // 📡 FFMPEG BROADCAST (WITH A/V SYNC)
//     // =========================================================================
//     function startBroadcast() {
//         if (ffmpegProcess) return; 
        
//         let ffmpegArgs = [];

//         // Added -async 1 and -max_muxing_queue_size to prevent audio/video desync
//         if (streamQuality.includes('40KBps')) {
//             console.log('\n[*] 🚀 FFmpeg Mode: ULTRA-LOW BANDWIDTH (360p @ 20FPS)...');
//             ffmpegArgs = [
//                 '-y', '-use_wallclock_as_timestamps', '1', '-thread_queue_size', '1024',
//                 '-f', 'x11grab', '-draw_mouse', '0', '-video_size', '1280x720', '-framerate', '20',
//                 '-i', displayNum, '-thread_queue_size', '1024', '-f', 'pulse', '-i', 'default',
//                 '-vf', 'scale=640:360',
//                 '-c:v', 'libx264', '-preset', 'veryfast', '-profile:v', 'baseline',
//                 '-b:v', '200k', '-maxrate', '250k', '-bufsize', '500k',
//                 '-pix_fmt', 'yuv420p', '-g', '40', '-max_muxing_queue_size', '1024',
//                 '-c:a', 'aac', '-b:a', '32k', '-ac', '1', '-ar', '44100',
//                 '-async', '1', '-f', 'flv', RTMP_DESTINATION 
//             ];
//         } else {
//             console.log('\n[*] 🚀 FFmpeg Mode: BALANCED 480p (854x480 @ 30FPS)...');
//             ffmpegArgs = [
//                 '-y', '-use_wallclock_as_timestamps', '1', '-thread_queue_size', '1024',
//                 '-f', 'x11grab', '-draw_mouse', '0', '-video_size', '1280x720', '-framerate', '30',
//                 '-i', displayNum, '-thread_queue_size', '1024', '-f', 'pulse', '-i', 'default',
//                 '-vf', 'scale=854:480',
//                 '-c:v', 'libx264', '-preset', 'veryfast', '-profile:v', 'main',
//                 '-b:v', '800k', '-maxrate', '850k', '-bufsize', '1700k',
//                 '-pix_fmt', 'yuv420p', '-g', '60', '-max_muxing_queue_size', '1024',
//                 '-c:a', 'aac', '-b:a', '64k', '-ac', '2', '-ar', '44100',
//                 '-async', '1', '-f', 'flv', RTMP_DESTINATION 
//             ];
//         }

//         ffmpegProcess = spawn('ffmpeg', ffmpegArgs);

//         ffmpegProcess.stderr.on('data', (data) => {
//             const output = data.toString().trim();
//             if (output.includes('Error') || output.includes('Failed')) {
//                 console.log(`\n[FFmpeg Issue]: ${output}`);
//             }
//         });

//         ffmpegProcess.on('close', (code) => console.log(`\n[*] FFmpeg exited (Code: ${code})`));
//     }

//     await applyFullscreenHack();
//     startBroadcast();

//     // =========================================================================
//     // 🧠 THE SMART WATCHDOG (With Fallback Overlay)
//     // =========================================================================
//     console.log('\n[*] Smart Engine Connected! Monitoring Video Health 24/7...');

//     let bufferCounter = 0; 

//     while (true) {
//         if (!browser || !browser.isConnected()) throw new Error("Browser closed.");

//         const status = await targetFrame.evaluate(() => {
//             const bodyText = document.body.innerText.toLowerCase();
//             if (bodyText.includes("stream error") || bodyText.includes("could not be loaded")) {
//                 return 'CRITICAL_ERROR';
//             }

//             const v = document.querySelector('video[data-html5-video]') || document.querySelector('video');
//             if (!v || v.ended) return 'DEAD';

//             // Agar video buffering par hai toh Overlay show karo
//             if (v.readyState < 2) {
//                 let overlay = document.getElementById('watchdog-recovery-overlay');
//                 if (!overlay) {
//                     overlay = document.createElement('div');
//                     overlay.id = 'watchdog-recovery-overlay';
//                     overlay.innerHTML = '<h1 style="color:white; font-family:sans-serif;">Stream is buffering... Please wait!</h1>';
//                     overlay.style.position = 'fixed';
//                     overlay.style.top = '0'; overlay.style.left = '0';
//                     overlay.style.width = '100vw'; overlay.style.height = '100vh';
//                     overlay.style.backgroundColor = 'black';
//                     overlay.style.zIndex = '2147483647';
//                     overlay.style.display = 'flex';
//                     overlay.style.alignItems = 'center';
//                     overlay.style.justifyContent = 'center';
//                     document.body.appendChild(overlay);
//                 }
//                 return 'BUFFERING'; 
//             }

//             // Agar healthy hai toh Overlay hata do
//             let existingOverlay = document.getElementById('watchdog-recovery-overlay');
//             if (existingOverlay) existingOverlay.remove();

//             // Strict Fullscreen Check (Privacy maintain karne ke liye)
//             const isNativeFullscreen = (document.fullscreenElement === v || document.webkitFullscreenElement === v);
//             const isCssFullscreen = (v.style.position === 'fixed' && v.style.width === '100vw');
            
//             if (!isNativeFullscreen && !isCssFullscreen) {
//                 v.style.position = 'fixed';
//                 v.style.top = '0';
//                 v.style.left = '0';
//                 v.style.width = '100vw';
//                 v.style.height = '100vh';
//                 v.style.zIndex = '2147483647';
//                 v.style.backgroundColor = 'black';
//                 v.style.objectFit = 'contain';
//                 return 'HEALED_FULLSCREEN';
//             }

//             return 'HEALTHY';
//         }).catch(() => 'EVAL_ERROR');

//         if (status === 'CRITICAL_ERROR' || status === 'DEAD') {
//             console.log('\n[!] ❌ STREAM DEAD DETECTED! Restarting process...');
//             throw new Error("Watchdog detected video dead."); 
//         }

//         if (status === 'BUFFERING') {
//             bufferCounter++;
//             console.log(`[!] Video is buffering... showing Holding Screen to viewers. (${bufferCounter}/15)`);
//             if (bufferCounter > 15) throw new Error("Video stuck in buffering for too long.");
//         } else {
//             bufferCounter = 0; 
//         }

//         await new Promise(r => setTimeout(r, 3000)); 
//     }
// }

// async function cleanup() {
//     if (ffmpegProcess) {
//         try { ffmpegProcess.stdin.end(); ffmpegProcess.kill('SIGKILL'); } catch (e) { }
//         ffmpegProcess = null;
//     }
//     if (browser) {
//         try { await browser.close(); } catch (e) { }
//         browser = null;
//     }
// }

// process.on('SIGINT', async () => {
//     console.log('\n[*] Stopping live script cleanly...');
//     await cleanup();
//     process.exit(0);
// });

// mainLoop();











































































































// ================= yeh bilkul teek hai bas upper srf testing karty hai key aor behtar ban ta hai y nahyi ===========================


// const puppeteer = require('puppeteer-extra');
// const StealthPlugin = require('puppeteer-extra-plugin-stealth');
// puppeteer.use(StealthPlugin());

// const { spawn, execSync } = require('child_process');
// const { PuppeteerScreenRecorder } = require('puppeteer-screen-recorder');

// // 🚀 NAYA: Multi-Stream Key Manager
// const STREAM_KEYS = {
//     '1': '14601603391083_14040893622891_puxzrwjniu', // Aapka pehla key
//     '2': '14601696583275_14041072274027_apdzpdb5xi', // ⚠️ INKO APNE ASLI KEYS SE REPLACE KAREIN
//     '3': '14617940008555_14072500914795_ohw67ls7ny',
//     '4': '14601972227691_14041593547371_obdhgewlmq',
//     '5': 'YOUR_STREAM_KEY_5_HERE'
// };

// const TARGET_URL = process.env.TARGET_URL || 'https://dadocric.st/player.php?id=starsp3&v=m';
// const SELECTED_CHANNEL = process.env.OKRU_STREAM_ID || '1';
// const ACTIVE_STREAM_KEY = STREAM_KEYS[SELECTED_CHANNEL] || STREAM_KEYS['1'];

// const RTMP_SERVER = 'rtmp://vsu.okcdn.ru/input/';
// const RTMP_DESTINATION = `${RTMP_SERVER}${ACTIVE_STREAM_KEY}`;

// let browser = null;
// let ffmpegProcess = null;

// // =========================================================================
// // 🔄 MAIN LOOP: Agar stream rukay toh 3 sec baad poora process restart karega
// // =========================================================================
// async function mainLoop() {
//     while (true) {
//         try {
//             await startDirectStreaming();
//         } catch (error) {
//             console.error(`\n[!] ALERT: ${error.message}`);
//             console.log('[*] 🔄 Restarting everything in 3 seconds as requested...');
//             await cleanup();
//             await new Promise(resolve => setTimeout(resolve, 3000)); // 3 Seconds Refresh Delay
//         }
//     }
// }

// async function startDirectStreaming() {
//     console.log(`[*] Starting browser and FFmpeg...`);
//     console.log(`[+] Broadcasting to OK.ru CHANNEL: ${SELECTED_CHANNEL}`);

//     const useProxy = process.env.USE_PROXY === 'ON';
//     const proxyIpPort = process.env.PROXY_IP_PORT || '31.59.20.176:6754';
//     const proxyUser = process.env.PROXY_USER || 'kexwytuq';
//     const proxyPass = process.env.PROXY_PASS || 'fw1k19a4lqfd';
    
//     const streamQuality = process.env.STREAM_QUALITY || '110KBps (Balanced 480p)';

//     const browserArgs = [
//         '--no-sandbox',
//         '--disable-setuid-sandbox',
//         '--window-size=1280,720',
//         '--kiosk', 
//         '--autoplay-policy=no-user-gesture-required'
//     ];

//     if (useProxy) {
//         browserArgs.push(`--proxy-server=http://${proxyIpPort}`);
//     }

//     console.log(`Launching Browser on GitHub Actions Virtual Screen with Proxy: ${useProxy ? 'ON' : 'OFF'}...`);
//     browser = await puppeteer.launch({
//         channel: 'chrome',
//         headless: false, 
//         defaultViewport: { width: 1280, height: 720 },
//         ignoreDefaultArgs: ['--enable-automation'], 
//         args: browserArgs
//     });

//     const page = await browser.newPage();

//     const pages = await browser.pages();
//     for (const p of pages) {
//         if (p !== page) await p.close();
//     }

//     // Aggressive Ad-Popup Blocker
//     browser.on('targetcreated', async (target) => {
//         if (target.type() === 'page') {
//             try {
//                 const newPage = await target.page();
//                 if (newPage && newPage !== page) {
//                     console.log(`[*] Adware tab detected! Forcing video tab back to foreground visually...`);
//                     await page.bringToFront(); 
//                     setTimeout(() => newPage.close().catch(() => { }), 2000);
//                 }
//             } catch (e) { }
//         }
//     });

//     if (useProxy) {
//         await page.authenticate({ username: proxyUser, password: proxyPass });
//         console.log("Proxy credentials applied successfully.");
//     }

//     // =========================================================================
//     // 🎥 GUI Visual Recorder (20 Sec Debug to GitHub Releases)
//     // =========================================================================
//     const recorder = new PuppeteerScreenRecorder(page);
//     const fileName = `debug_video_${Date.now()}.mp4`;
//     await recorder.start(fileName);
//     console.log(`🎥 [*] 20-second Visual Debug Recording Started: ${fileName}...`);

//     setTimeout(async () => {
//         try {
//             await recorder.stop();
//             console.log('🛑 [*] Visual Screen recording stopped. Uploading to GitHub Releases...');
//             const tagName = `visual-debug-${Date.now()}`;
//             execSync(`gh release create ${tagName} ${fileName} --title "Puppeteer Visual Capture"`, { stdio: 'inherit' });
//             console.log('✅ [+] Successfully uploaded visual debug wrapper!');
//         } catch (err) {
//             console.error('❌ [!] Failed to upload visual debug wrapper:', err.message);
//         }
//     }, 20000);

//     const displayNum = process.env.DISPLAY || ':99';

//     console.log(`[*] Navigating to target URL: ${TARGET_URL}...`);
//     await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });

//     console.log('[*] Waiting for potential Cloudflare...');
//     for (let i = 0; i < 15; i++) {
//         const title = await page.title();
//         if (!title.includes('Moment') && !title.includes('Cloudflare')) break;
//         await new Promise(r => setTimeout(r, 1000));
//     }

//     await new Promise(resolve => setTimeout(resolve, 8000));

//     // =========================================================================
//     // 🧠 THE SMART SCANNER & CLEANER 
//     // =========================================================================
//     let targetFrame = null;
//     console.log('[*] Scanning iframes for the REAL Live Stream Video...');
//     for (const frame of page.frames()) {
//         try {
//             // 1. Asli video frame dhoondo (Project 1 Integration)
//             const isRealLiveStream = await frame.evaluate(() => {
//                 // 🚀 PROJECT 1: Selecting the specific clappr/html5 video element
//                 const vid = document.querySelector('video[data-html5-video]') || document.querySelector('video');
//                 if (!vid) return false;
//                 if (vid.clientWidth < 300 || vid.clientHeight < 200) return false;
//                 return true; 
//             });

//             if (isRealLiveStream) {
//                 targetFrame = frame;
//                 console.log(`[+] Smart Scanner selected Real Video in frame: ${frame.url() || 'unknown'}`);
//             }

//             // 2. "onmouseup" wale khatarnaak Ad/Overlay ko code se tabah karo!
//             await frame.evaluate(() => {
//                 const floatedAd = document.getElementById('floated');
//                 if (floatedAd) {
//                     floatedAd.remove(); // Hamesha ke liye delete!
//                     console.log('DEBUG: Asli ad overlay (floated) completely removed!');
//                 }
//             });

//         } catch (e) { }
//     }

//     if (!targetFrame) throw new Error('No <video> element could be found.');

//     // =========================================================================
//     // 🔊 AUDIO UNLOCKER: The Center Click
//     // =========================================================================
//     console.log('[*] Applying Physical Center Click to register User Action for Audio...');
//     try {
//         const iframeEl = await targetFrame.frameElement();
//         const box = await iframeEl.boundingBox();
//         if (box) {
//             await page.mouse.click(box.x + (box.width / 2), box.y + (box.height / 2), { delay: 100 });
//             console.log('[+] Real physical click executed on the center of the video player.');
//         }
//         await new Promise(r => setTimeout(r, 2000));
//     } catch (e) {
//         console.log('[!] Center click failed: ', e.message);
//     }

//     console.log('[*] Executing JS Unmute & Volume Max logic...');
//     await targetFrame.evaluate(async () => {
//         // 🚀 PROJECT 1: Selecting the specific clappr/html5 video element
//         const video = document.querySelector('video[data-html5-video]') || document.querySelector('video');
//         if (!video) return false;
        
//         video.muted = false; 
//         video.volume = 1.0; 
        
//         await video.play().catch(e => {});
//         return true;
//     });

//     // =========================================================================
//     // 🛠️ REUSABLE FUNCTIONS 
//     // =========================================================================
//     async function applyFullscreenHack() {
//         console.log('\n[*] Executing Fullscreen Script...');
        
//         // 🚀 STEP 1: Main page (website) mein mojud Iframe ko poori screen par stretch karo!
//         // Yeh website ki chat aur baqi UI ko chupa dega.
//         await page.evaluate(() => {
//             const iframes = document.querySelectorAll('iframe');
//             iframes.forEach(iframe => {
//                 iframe.style.position = 'fixed';
//                 iframe.style.top = '0';
//                 iframe.style.left = '0';
//                 iframe.style.width = '100vw';
//                 iframe.style.height = '100vh';
//                 iframe.style.zIndex = '2147483647'; // Sabse upar lay aao
//                 iframe.style.backgroundColor = 'black';
//             });
//         });

//         // 🚀 STEP 2: Iframe ke andar wali video par normal hack lagao
//         const debugLogs = await targetFrame.evaluate(async () => {
//             let terminalLogs = [];
//             const vid = document.querySelector('video[data-html5-video]') || document.querySelector('video');
//             if (!vid) return terminalLogs;
            
//             try {
//                 if (vid.requestFullscreen) await vid.requestFullscreen();
//                 else if (vid.webkitRequestFullscreen) await vid.webkitRequestFullscreen();
//                 terminalLogs.push("🎉 RESULT: requestFullscreen() SUCCESS!");
//             } catch (err) {
//                 vid.style.position = 'fixed';
//                 vid.style.top = '0';
//                 vid.style.left = '0';
//                 vid.style.width = '100vw';
//                 vid.style.height = '100vh';
//                 vid.style.zIndex = '2147483647';
//                 vid.style.backgroundColor = 'black';
//                 vid.style.objectFit = 'contain';
//                 terminalLogs.push("✅ RESULT: CSS Force-Stretch Hack Successfully lag gaya!");
//             }
//             return terminalLogs;
//         });
        
//         for (const log of debugLogs) console.log(log);
//         await new Promise(r => setTimeout(r, 2000));
//     }

//     function startBroadcast() {
//         if (ffmpegProcess) return; 
        
//         let ffmpegArgs = [];

//         if (streamQuality.includes('40KBps')) {
//             console.log('\n[*] 🚀 FFmpeg Mode: ULTRA-LOW BANDWIDTH (360p @ 20FPS, 200k Video, 32k Audio)...');
//             ffmpegArgs = [
//                 '-y', '-use_wallclock_as_timestamps', '1', '-thread_queue_size', '1024',
//                 '-f', 'x11grab', '-draw_mouse', '0', '-video_size', '1280x720', '-framerate', '20',
//                 '-i', displayNum, '-thread_queue_size', '1024', '-f', 'pulse', '-i', 'default',
//                 '-vf', 'scale=640:360',
//                 '-c:v', 'libx264', '-preset', 'veryfast', '-profile:v', 'baseline',
//                 '-b:v', '200k', '-maxrate', '250k', '-bufsize', '500k',
//                 '-pix_fmt', 'yuv420p', '-g', '40',
//                 '-c:a', 'aac', '-b:a', '32k', '-ac', '1', '-ar', '44100',
//                 '-af', 'aresample=async=1', '-f', 'flv', RTMP_DESTINATION 
//             ];
//         } else {
//             console.log('\n[*] 🚀 FFmpeg Mode: BALANCED 480p (854x480 @ 30FPS, 800k Video, 64k Audio)...');
//             ffmpegArgs = [
//                 '-y', '-use_wallclock_as_timestamps', '1', '-thread_queue_size', '1024',
//                 '-f', 'x11grab', '-draw_mouse', '0', '-video_size', '1280x720', '-framerate', '30',
//                 '-i', displayNum, '-thread_queue_size', '1024', '-f', 'pulse', '-i', 'default',
//                 '-vf', 'scale=854:480',
//                 '-c:v', 'libx264', '-preset', 'veryfast', '-profile:v', 'main',
//                 '-b:v', '800k', '-maxrate', '850k', '-bufsize', '1700k',
//                 '-pix_fmt', 'yuv420p', '-g', '60',
//                 '-c:a', 'aac', '-b:a', '64k', '-ac', '2', '-ar', '44100',
//                 '-af', 'aresample=async=1', '-f', 'flv', RTMP_DESTINATION 
//             ];
//         }

//         ffmpegProcess = spawn('ffmpeg', ffmpegArgs);

//         let heartbeatCount = 0;
//         let lastHeartbeatTime = Date.now();
//         const FIVE_MINUTES = 5 * 60 * 1000;

//         ffmpegProcess.stderr.on('data', (data) => {
//             const output = data.toString().trim();
//             if (output.includes('frame=') && output.includes('fps=')) {
//                 heartbeatCount++;
//                 const currentTime = Date.now();
//                 if (heartbeatCount <= 7) {
//                     console.log(`[FFmpeg ${heartbeatCount}/7]: ${output.substring(0, 100)}`);
//                     if (heartbeatCount === 7) console.log(`\n[✅ Success] Stream is live! Suppressing logs...`);
//                 } else if (currentTime - lastHeartbeatTime >= FIVE_MINUTES) {
//                     console.log(`[FFmpeg 5-Min Check]: ${output.substring(0, 100)}`);
//                     lastHeartbeatTime = currentTime; 
//                 }
//             } else if (output.includes('Error') || output.includes('Failed')) {
//                 console.log(`\n[FFmpeg Issue]: ${output}`);
//             }
//         });

//         ffmpegProcess.on('close', (code) => console.log(`\n[*] FFmpeg exited (Code: ${code})`));
//     }

//     // =========================================================================
//     // 🚀 INITIAL STARTUP
//     // =========================================================================
//     await applyFullscreenHack();
//     startBroadcast();

//     // =========================================================================
//     // 🧠 THE SMART WATCHDOG (Aggressive Auto-Refresh Mode)
//     // =========================================================================


//     // =========================================================================
//     // 🧠 THE SMART WATCHDOG (Aggressive Fullscreen & Auto-Refresh Mode)
//     // =========================================================================

//     // =========================================================================
//     // 🧠 THE SMART WATCHDOG (Aggressive Fullscreen & Auto-Refresh Mode)
//     // =========================================================================
//     console.log('\n[*] Smart Engine Connected! Monitoring Video Health & Fullscreen State 24/7...');

//     while (true) {
//         if (!browser || !browser.isConnected()) throw new Error("Browser closed.");

//         const isHealthy = await targetFrame.evaluate(() => {
//             // 🚀 1. "Stream Error" UI TEXT CHECK (Image wala error pakarne ke liye)
//             const bodyText = document.body.innerText.toLowerCase();
//             if (bodyText.includes("stream error") || bodyText.includes("stream unavailable") || bodyText.includes("could not be loaded")) {
//                 return false; // Fail karo taake restart ho jaye
//             }

//             // 2. Video Element Dhoondo
//             const v = document.querySelector('video[data-html5-video]') || document.querySelector('video');
            
//             // Agar video nahi hai, ruki hui hai, ya khatam ho gayi hai
//             if (!v || v.paused || v.ended) return false;

//             // 🚀 3. VIDEO DATA CHECK (readyState)
//             // readyState < 2 ka matlab hai video atki hui hai, buffering par hai ya source link dead hai
//             if (v.readyState < 2) return false; 

//             // 4. FULLSCREEN LOGIC
//             const isNativeFullscreen = (document.fullscreenElement === v || document.webkitFullscreenElement === v);
            
//             // Ab iframe bhi bada hai toh yeh check bilkul theek se kaam karega
//             const isCssFullscreen = (v.style.position === 'fixed' && v.style.width === '100vw');
//             const isAlmostFullScreen = (v.clientWidth >= window.innerWidth * 0.95);

//             const isFullscreen = isNativeFullscreen || isCssFullscreen || isAlmostFullScreen;

//             return isFullscreen;
//         }).catch(() => false); // Agar kisi wajah se evaluate fail ho, toh bhi restart maro

//         if (!isHealthy) {
//             console.log('\n=================================================================');
//             console.log('❌ ❌ ❌ STREAM CRASH / EXITED FULLSCREEN DETECTED! ❌ ❌ ❌');
//             console.log('🛑 TRIGGERING AUTO-REFRESH PROTOCOL (Restarting in 3 Sec)...');
//             console.log('=================================================================\n');
//             throw new Error("Watchdog detected video exited fullscreen, stopped playing, or hit a Stream Error."); 
//         }

//         await new Promise(r => setTimeout(r, 3000)); // Har 3 second baad monitor karega
//     }

// }

// async function cleanup() {
//     if (ffmpegProcess) {
//         try { ffmpegProcess.stdin.end(); ffmpegProcess.kill('SIGKILL'); } catch (e) { }
//         ffmpegProcess = null;
//     }
//     if (browser) {
//         try { await browser.close(); } catch (e) { }
//         browser = null;
//     }
// }

// process.on('SIGINT', async () => {
//     console.log('\n[*] Stopping live script cleanly...');
//     await cleanup();
//     process.exit(0);
// });

// mainLoop();




























































































































// ======= Alhamdullah sab kuch teek hai , bas eek chuta sa issue hai k jab stream off hu jaty hai pher yeh ok.ru mei fullwebiste capture karky beechta hai ================



// const puppeteer = require('puppeteer-extra');
// const StealthPlugin = require('puppeteer-extra-plugin-stealth');
// puppeteer.use(StealthPlugin());

// const { spawn, execSync } = require('child_process');
// const { PuppeteerScreenRecorder } = require('puppeteer-screen-recorder');

// // 🚀 NAYA: Multi-Stream Key Manager
// const STREAM_KEYS = {
//     '1': '14601603391083_14040893622891_puxzrwjniu', // Aapka pehla key
//     '2': '14601696583275_14041072274027_apdzpdb5xi', // ⚠️ INKO APNE ASLI KEYS SE REPLACE KAREIN
//     '3': '14617940008555_14072500914795_ohw67ls7ny',
//     '4': '14601972227691_14041593547371_obdhgewlmq',
//     '5': 'YOUR_STREAM_KEY_5_HERE'
// };

// const TARGET_URL = process.env.TARGET_URL || 'https://dadocric.st/player.php?id=starsp3&v=m';
// const SELECTED_CHANNEL = process.env.OKRU_STREAM_ID || '1';
// const ACTIVE_STREAM_KEY = STREAM_KEYS[SELECTED_CHANNEL] || STREAM_KEYS['1'];

// const RTMP_SERVER = 'rtmp://vsu.okcdn.ru/input/';
// const RTMP_DESTINATION = `${RTMP_SERVER}${ACTIVE_STREAM_KEY}`;

// let browser = null;
// let ffmpegProcess = null;

// // =========================================================================
// // 🔄 MAIN LOOP: Agar stream rukay toh 3 sec baad poora process restart karega
// // =========================================================================
// async function mainLoop() {
//     while (true) {
//         try {
//             await startDirectStreaming();
//         } catch (error) {
//             console.error(`\n[!] ALERT: ${error.message}`);
//             console.log('[*] 🔄 Restarting everything in 3 seconds as requested...');
//             await cleanup();
//             await new Promise(resolve => setTimeout(resolve, 3000)); // 3 Seconds Refresh Delay
//         }
//     }
// }

// async function startDirectStreaming() {
//     console.log(`[*] Starting browser and FFmpeg...`);
//     console.log(`[+] Broadcasting to OK.ru CHANNEL: ${SELECTED_CHANNEL}`);

//     const useProxy = process.env.USE_PROXY === 'ON';
//     const proxyIpPort = process.env.PROXY_IP_PORT || '31.59.20.176:6754';
//     const proxyUser = process.env.PROXY_USER || 'kexwytuq';
//     const proxyPass = process.env.PROXY_PASS || 'fw1k19a4lqfd';
    
//     const streamQuality = process.env.STREAM_QUALITY || '110KBps (Balanced 480p)';

//     const browserArgs = [
//         '--no-sandbox',
//         '--disable-setuid-sandbox',
//         '--window-size=1280,720',
//         '--kiosk', 
//         '--autoplay-policy=no-user-gesture-required'
//     ];

//     if (useProxy) {
//         browserArgs.push(`--proxy-server=http://${proxyIpPort}`);
//     }

//     console.log(`Launching Browser on GitHub Actions Virtual Screen with Proxy: ${useProxy ? 'ON' : 'OFF'}...`);
//     browser = await puppeteer.launch({
//         channel: 'chrome',
//         headless: false, 
//         defaultViewport: { width: 1280, height: 720 },
//         ignoreDefaultArgs: ['--enable-automation'], 
//         args: browserArgs
//     });

//     const page = await browser.newPage();

//     const pages = await browser.pages();
//     for (const p of pages) {
//         if (p !== page) await p.close();
//     }

//     // Aggressive Ad-Popup Blocker
//     browser.on('targetcreated', async (target) => {
//         if (target.type() === 'page') {
//             try {
//                 const newPage = await target.page();
//                 if (newPage && newPage !== page) {
//                     console.log(`[*] Adware tab detected! Forcing video tab back to foreground visually...`);
//                     await page.bringToFront(); 
//                     setTimeout(() => newPage.close().catch(() => { }), 2000);
//                 }
//             } catch (e) { }
//         }
//     });

//     if (useProxy) {
//         await page.authenticate({ username: proxyUser, password: proxyPass });
//         console.log("Proxy credentials applied successfully.");
//     }

//     // =========================================================================
//     // 🎥 GUI Visual Recorder (20 Sec Debug to GitHub Releases)
//     // =========================================================================
//     const recorder = new PuppeteerScreenRecorder(page);
//     const fileName = `debug_video_${Date.now()}.mp4`;
//     await recorder.start(fileName);
//     console.log(`🎥 [*] 20-second Visual Debug Recording Started: ${fileName}...`);

//     setTimeout(async () => {
//         try {
//             await recorder.stop();
//             console.log('🛑 [*] Visual Screen recording stopped. Uploading to GitHub Releases...');
//             const tagName = `visual-debug-${Date.now()}`;
//             execSync(`gh release create ${tagName} ${fileName} --title "Puppeteer Visual Capture"`, { stdio: 'inherit' });
//             console.log('✅ [+] Successfully uploaded visual debug wrapper!');
//         } catch (err) {
//             console.error('❌ [!] Failed to upload visual debug wrapper:', err.message);
//         }
//     }, 20000);

//     const displayNum = process.env.DISPLAY || ':99';

//     console.log(`[*] Navigating to target URL: ${TARGET_URL}...`);
//     await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });

//     console.log('[*] Waiting for potential Cloudflare...');
//     for (let i = 0; i < 15; i++) {
//         const title = await page.title();
//         if (!title.includes('Moment') && !title.includes('Cloudflare')) break;
//         await new Promise(r => setTimeout(r, 1000));
//     }

//     await new Promise(resolve => setTimeout(resolve, 8000));

//     // =========================================================================
//     // 🧠 THE SMART SCANNER & CLEANER 
//     // =========================================================================
//     let targetFrame = null;
//     console.log('[*] Scanning iframes for the REAL Live Stream Video...');
//     for (const frame of page.frames()) {
//         try {
//             // 1. Asli video frame dhoondo (Project 1 Integration)
//             const isRealLiveStream = await frame.evaluate(() => {
//                 // 🚀 PROJECT 1: Selecting the specific clappr/html5 video element
//                 const vid = document.querySelector('video[data-html5-video]') || document.querySelector('video');
//                 if (!vid) return false;
//                 if (vid.clientWidth < 300 || vid.clientHeight < 200) return false;
//                 return true; 
//             });

//             if (isRealLiveStream) {
//                 targetFrame = frame;
//                 console.log(`[+] Smart Scanner selected Real Video in frame: ${frame.url() || 'unknown'}`);
//             }

//             // 2. "onmouseup" wale khatarnaak Ad/Overlay ko code se tabah karo!
//             await frame.evaluate(() => {
//                 const floatedAd = document.getElementById('floated');
//                 if (floatedAd) {
//                     floatedAd.remove(); // Hamesha ke liye delete!
//                     console.log('DEBUG: Asli ad overlay (floated) completely removed!');
//                 }
//             });

//         } catch (e) { }
//     }

//     if (!targetFrame) throw new Error('No <video> element could be found.');

//     // =========================================================================
//     // 🔊 AUDIO UNLOCKER: The Center Click
//     // =========================================================================
//     console.log('[*] Applying Physical Center Click to register User Action for Audio...');
//     try {
//         const iframeEl = await targetFrame.frameElement();
//         const box = await iframeEl.boundingBox();
//         if (box) {
//             await page.mouse.click(box.x + (box.width / 2), box.y + (box.height / 2), { delay: 100 });
//             console.log('[+] Real physical click executed on the center of the video player.');
//         }
//         await new Promise(r => setTimeout(r, 2000));
//     } catch (e) {
//         console.log('[!] Center click failed: ', e.message);
//     }

//     console.log('[*] Executing JS Unmute & Volume Max logic...');
//     await targetFrame.evaluate(async () => {
//         // 🚀 PROJECT 1: Selecting the specific clappr/html5 video element
//         const video = document.querySelector('video[data-html5-video]') || document.querySelector('video');
//         if (!video) return false;
        
//         video.muted = false; 
//         video.volume = 1.0; 
        
//         await video.play().catch(e => {});
//         return true;
//     });

//     // =========================================================================
//     // 🛠️ REUSABLE FUNCTIONS 
//     // =========================================================================
//     async function applyFullscreenHack() {
//         console.log('\n[*] Executing Fullscreen Script...');
//         const debugLogs = await targetFrame.evaluate(async () => {
//             let terminalLogs = [];
//             // 🚀 PROJECT 1: Selecting the specific clappr/html5 video element
//             const vid = document.querySelector('video[data-html5-video]') || document.querySelector('video');
//             if (!vid) return terminalLogs;
            
//             try {
//                 if (vid.requestFullscreen) await vid.requestFullscreen();
//                 else if (vid.webkitRequestFullscreen) await vid.webkitRequestFullscreen();
//                 terminalLogs.push("🎉 RESULT: requestFullscreen() SUCCESS!");
//             } catch (err) {
//                 vid.style.position = 'fixed';
//                 vid.style.top = '0';
//                 vid.style.left = '0';
//                 vid.style.width = '100vw';
//                 vid.style.height = '100vh';
//                 vid.style.zIndex = '2147483647';
//                 vid.style.backgroundColor = 'black';
//                 vid.style.objectFit = 'contain';
//                 terminalLogs.push("✅ RESULT: CSS Force-Stretch Hack Successfully lag gaya!");
//             }
//             return terminalLogs;
//         });
//         for (const log of debugLogs) console.log(log);
//         await new Promise(r => setTimeout(r, 2000));
//     }

//     function startBroadcast() {
//         if (ffmpegProcess) return; 
        
//         let ffmpegArgs = [];

//         if (streamQuality.includes('40KBps')) {
//             console.log('\n[*] 🚀 FFmpeg Mode: ULTRA-LOW BANDWIDTH (360p @ 20FPS, 200k Video, 32k Audio)...');
//             ffmpegArgs = [
//                 '-y', '-use_wallclock_as_timestamps', '1', '-thread_queue_size', '1024',
//                 '-f', 'x11grab', '-draw_mouse', '0', '-video_size', '1280x720', '-framerate', '20',
//                 '-i', displayNum, '-thread_queue_size', '1024', '-f', 'pulse', '-i', 'default',
//                 '-vf', 'scale=640:360',
//                 '-c:v', 'libx264', '-preset', 'veryfast', '-profile:v', 'baseline',
//                 '-b:v', '200k', '-maxrate', '250k', '-bufsize', '500k',
//                 '-pix_fmt', 'yuv420p', '-g', '40',
//                 '-c:a', 'aac', '-b:a', '32k', '-ac', '1', '-ar', '44100',
//                 '-af', 'aresample=async=1', '-f', 'flv', RTMP_DESTINATION 
//             ];
//         } else {
//             console.log('\n[*] 🚀 FFmpeg Mode: BALANCED 480p (854x480 @ 30FPS, 800k Video, 64k Audio)...');
//             ffmpegArgs = [
//                 '-y', '-use_wallclock_as_timestamps', '1', '-thread_queue_size', '1024',
//                 '-f', 'x11grab', '-draw_mouse', '0', '-video_size', '1280x720', '-framerate', '30',
//                 '-i', displayNum, '-thread_queue_size', '1024', '-f', 'pulse', '-i', 'default',
//                 '-vf', 'scale=854:480',
//                 '-c:v', 'libx264', '-preset', 'veryfast', '-profile:v', 'main',
//                 '-b:v', '800k', '-maxrate', '850k', '-bufsize', '1700k',
//                 '-pix_fmt', 'yuv420p', '-g', '60',
//                 '-c:a', 'aac', '-b:a', '64k', '-ac', '2', '-ar', '44100',
//                 '-af', 'aresample=async=1', '-f', 'flv', RTMP_DESTINATION 
//             ];
//         }

//         ffmpegProcess = spawn('ffmpeg', ffmpegArgs);

//         let heartbeatCount = 0;
//         let lastHeartbeatTime = Date.now();
//         const FIVE_MINUTES = 5 * 60 * 1000;

//         ffmpegProcess.stderr.on('data', (data) => {
//             const output = data.toString().trim();
//             if (output.includes('frame=') && output.includes('fps=')) {
//                 heartbeatCount++;
//                 const currentTime = Date.now();
//                 if (heartbeatCount <= 7) {
//                     console.log(`[FFmpeg ${heartbeatCount}/7]: ${output.substring(0, 100)}`);
//                     if (heartbeatCount === 7) console.log(`\n[✅ Success] Stream is live! Suppressing logs...`);
//                 } else if (currentTime - lastHeartbeatTime >= FIVE_MINUTES) {
//                     console.log(`[FFmpeg 5-Min Check]: ${output.substring(0, 100)}`);
//                     lastHeartbeatTime = currentTime; 
//                 }
//             } else if (output.includes('Error') || output.includes('Failed')) {
//                 console.log(`\n[FFmpeg Issue]: ${output}`);
//             }
//         });

//         ffmpegProcess.on('close', (code) => console.log(`\n[*] FFmpeg exited (Code: ${code})`));
//     }

//     // =========================================================================
//     // 🚀 INITIAL STARTUP
//     // =========================================================================
//     await applyFullscreenHack();
//     startBroadcast();

//     // =========================================================================
//     // 🧠 THE SMART WATCHDOG (Aggressive Auto-Refresh Mode)
//     // =========================================================================


//     // =========================================================================
//     // 🧠 THE SMART WATCHDOG (Aggressive Fullscreen & Auto-Refresh Mode)
//     // =========================================================================
//     console.log('\n[*] Smart Engine Connected! Monitoring Video Health & Fullscreen State 24/7...');

//     while (true) {
//         if (!browser || !browser.isConnected()) throw new Error("Browser closed.");

//         const isHealthy = await targetFrame.evaluate(() => {
//             // 1. Video Element Dhoondo
//             const v = document.querySelector('video[data-html5-video]') || document.querySelector('video');
            
//             // Agar video nahi hai, ruki hui hai, ya khatam ho gayi hai toh direct FALSE
//             if (!v || v.paused || v.ended) return false;

//             // 2. NAYA CHECK: FULLSCREEN LOGIC
//             // Case A: Check karega agar Native API (F11 wala) se fullscreen hai
//             const isNativeFullscreen = (document.fullscreenElement === v || document.webkitFullscreenElement === v);
            
//             // Case B: Check karega agar hamara "CSS Force-Stretch Hack" laga hua hai (100vw/100vh)
//             const isCssFullscreen = (v.style.position === 'fixed' && v.style.width === '100vw');
            
//             // Case C: Agar width poori screen ke 95% se zyada hai toh bhi usay fullscreen manega
//             const isAlmostFullScreen = (v.clientWidth >= window.innerWidth * 0.95);

//             // Agar in teeno mein se koi ek bhi TRUE hai, iska matlab stream full screen par sahi chal rahi hai
//             const isFullscreen = isNativeFullscreen || isCssFullscreen || isAlmostFullScreen;

//             return isFullscreen;
//         }).catch(() => false);

//         if (!isHealthy) {
//             console.log('\n=================================================================');
//             console.log('❌ ❌ ❌ STREAM CRASH / EXITED FULLSCREEN DETECTED! ❌ ❌ ❌');
//             console.log('🛑 TRIGGERING AUTO-REFRESH PROTOCOL (Restarting in 3 Sec)...');
//             console.log('=================================================================\n');
//             throw new Error("Watchdog detected video exited fullscreen or stopped playing."); 
//         }

//         await new Promise(r => setTimeout(r, 3000)); // Har 3 second baad monitor karega
//     }

// }
// //     console.log('\n[*] Smart Engine Connected! Monitoring Video Health 24/7...');

// //     while (true) {
// //         if (!browser || !browser.isConnected()) throw new Error("Browser closed.");

// //         const isHealthy = await targetFrame.evaluate(() => {
// //             // 🚀 PROJECT 1: Selecting the specific clappr/html5 video element
// //             const v = document.querySelector('video[data-html5-video]') || document.querySelector('video');
// //             // Check: video mojud ho, pause na ho, khtam na hui ho, aur ad ki wajah se choti na ho
// //             return v && !v.paused && !v.ended && v.clientWidth > (window.innerWidth * 0.5);
// //         }).catch(() => false);

// //         if (!isHealthy) {
// //             console.log('\n=================================================================');
// //             console.log('❌ ❌ ❌ STREAM CRASH / AD INTERRUPT DETECTED! ❌ ❌ ❌');
// //             console.log('🛑 TRIGGERING AUTO-REFRESH PROTOCOL (Restarting in 3 Sec)...');
// //             console.log('=================================================================\n');
// //             throw new Error("Watchdog detected bad video state."); // Yeh error catch block mein ja kar page refresh karega
// //         }

// //         await new Promise(r => setTimeout(r, 3000)); // Har 3 second baad monitor karega
// //     }
// // }

// async function cleanup() {
//     if (ffmpegProcess) {
//         try { ffmpegProcess.stdin.end(); ffmpegProcess.kill('SIGKILL'); } catch (e) { }
//         ffmpegProcess = null;
//     }
//     if (browser) {
//         try { await browser.close(); } catch (e) { }
//         browser = null;
//     }
// }

// process.on('SIGINT', async () => {
//     console.log('\n[*] Stopping live script cleanly...');
//     await cleanup();
//     process.exit(0);
// });

// mainLoop();
