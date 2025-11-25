import express from 'express';
import dotenv from 'dotenv';

dotenv.config();
const app = express();

const PORT = process.env.PORT || 3000;

const aasaFile = {
    "applinks": {
        "apps": [],
        "details": [
            {
                "appIDs": [
                    "AS5BHHK5AW.com.reelmia.bs"
                ],
                "components": [
                    {
                        "/": "/share/card/*",
                        "comment": "Matches card sharing URLs"
                    }
                ]
            }
        ]
    }
}

app.get('/.well-known/apple-app-site-association', (req, res) => {
    res.set('Content-Type', 'application/json')
    res.json(aasaFile)
})

app.get('/apple-app-site-association', (req, res) => {
    res.set('Content-Type', 'application/json')
    res.json(aasaFile)
})

app.get('/share', (req, res) => {
    const encryptedData = req.query.d;
    const fragment = req.url.split('#')[1] || '';

    if (!encryptedData) {
        return res.redirect('/');
    }

    res.send(`
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pocketz - Geteilte Karte</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #FAFAFA;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
        }

        .header {
            background: white;
            padding: 16px 24px;
            border-bottom: 1px solid #F0F0F0;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .header-logo {
            width: 32px;
            height: 32px;
            background: #0066FF;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
        }

        .header-logo img {
            width: 100%;
            height: 100%;
        }

        .header-text {
            font-size: 20px;
            font-weight: 700;
            color: #1A1A1A;
            letter-spacing: -0.5px;
        }

        .main {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 40px 24px;
        }
        
        .container {
            max-width: 400px;
            width: 100%;
            text-align: center;
        }

        .icon-wrapper {
            width: 80px;
            height: 80px;
            background: #F0F7FF;
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 24px;
        }

        .icon-wrapper svg {
            width: 40px;
            height: 40px;
            color: #0066FF;
        }
        
        h1 {
            color: #1A1A1A;
            font-size: 28px;
            font-weight: 700;
            letter-spacing: -0.5px;
            margin-bottom: 8px;
        }
        
        .subtitle {
            color: #6B6B6B;
            font-size: 16px;
            line-height: 1.5;
            margin-bottom: 32px;
        }
        
        .btn {
            display: block;
            width: 100%;
            padding: 16px 24px;
            background: #0066FF;
            color: white;
            text-decoration: none;
            border-radius: 12px;
            font-weight: 600;
            font-size: 16px;
            border: none;
            cursor: pointer;
            transition: background 0.2s;
        }
        
        .btn:hover {
            background: #0052CC;
        }

        .btn:active {
            transform: scale(0.98);
        }
        
        .stores {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 12px;
            margin-top: 32px;
            padding-top: 32px;
            border-top: 1px solid #F0F0F0;
        }

        .stores-label {
            font-size: 14px;
            color: #6B6B6B;
        }

        .store-buttons {
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
            justify-content: center;
        }
        
        .store-badge {
            height: 44px;
        }
        
        #status {
            margin-top: 24px;
            color: #6B6B6B;
            font-size: 14px;
            min-height: 24px;
        }

        #status.success {
            color: #34C759;
        }

        .spinner {
            width: 24px;
            height: 24px;
            border: 3px solid #F0F0F0;
            border-top-color: #0066FF;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            margin: 0 auto 8px;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        @media (prefers-color-scheme: dark) {
            body {
                background: #0A0A0A;
            }

            .header {
                background: #1A1A1A;
                border-bottom-color: #2A2A2A;
            }

            .header-text {
                color: #FFFFFF;
            }

            .icon-wrapper {
                background: rgba(0, 102, 255, 0.15);
            }

            h1 {
                color: #FFFFFF;
            }

            .subtitle, .stores-label, #status {
                color: #8B8B8B;
            }

            .stores {
                border-top-color: #2A2A2A;
            }

            .spinner {
                border-color: #2A2A2A;
                border-top-color: #0066FF;
            }
        }
    </style>
</head>
<body>
    <header class="header">
        <div class="header-logo">
            <img src="/256.png" alt="Pocketz Logo">
        </div>
        <span class="header-text">Pocketz</span>
    </header>

    <main class="main">
        <div class="container">
            <div class="icon-wrapper">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="5" width="18" height="14" rx="2"/>
                    <path d="M3 10h18"/>
                </svg>
            </div>
            
            <h1>Karte erhalten</h1>
            <p class="subtitle">Jemand hat eine Kundenkarte mit dir geteilt. Öffne sie in der Pocketz App.</p>
            
            <button id="openApp" class="btn">In Pocketz öffnen</button>
            
            <p id="status"></p>
            
            <div class="stores">
                <span class="stores-label">Noch keine App? Jetzt herunterladen:</span>
                <div class="store-buttons">
                    <a href="https://apps.apple.com/app/pocketz/YOURAPPID" target="_blank">
                        <img src="https://tools.applemediaservices.com/api/badges/download-on-the-app-store/black/de-de?size=250x83" 
                             alt="Download on App Store" class="store-badge">
                    </a>
                    <a href="https://play.google.com/store/apps/details?id=com.yourname.pocketz" target="_blank">
                        <img src="/google_badge.svg" 
                             alt="Get it on Google Play" class="store-badge">
                    </a>
                </div>
            </div>
        </div>
    </main>

    <script>
        const encryptedData = '${encryptedData}';
        const fragment = window.location.hash.slice(1);
        
        const appUrl = \`pocketz://share?d=\${encryptedData}#\${fragment}\`;
        
        let startTime = Date.now();
        
        function tryOpenApp() {
            const status = document.getElementById('status');
            status.innerHTML = '<div class="spinner"></div>App wird geöffnet...';
            status.className = '';
            window.location.href = appUrl;
            
            setTimeout(() => {
                const timeElapsed = Date.now() - startTime;
                
                if (timeElapsed < 2500) {
                    status.textContent = 'App nicht installiert? Lade Pocketz herunter!';
                }
            }, 2000);
        }
        
        window.addEventListener('load', () => {
            setTimeout(tryOpenApp, 500);
        });
        
        document.getElementById('openApp').addEventListener('click', (e) => {
            e.preventDefault();
            startTime = Date.now();
            tryOpenApp();
        });
        
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                const timeElapsed = Date.now() - startTime;
                if (timeElapsed > 2500) {
                    const status = document.getElementById('status');
                    status.textContent = '✓ App wurde geöffnet';
                    status.className = 'success';
                }
            }
        });
    </script>
</body>
</html>
  `);
});

/*app.get('/share/card/:id', (req, res) => {
    const cardId = req.params.id;
    const cardData = req.query.data;

    res.send(`
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pocketz - Karte teilen</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .container {
            background: white;
            border-radius: 20px;
            padding: 40px 30px;
            max-width: 400px;
            text-align: center;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        
        .logo {
            font-size: 60px;
            margin-bottom: 20px;
        }
        
        h1 {
            color: #333;
            margin-bottom: 10px;
            font-size: 24px;
        }
        
        p {
            color: #666;
            margin-bottom: 30px;
            line-height: 1.6;
        }
        
        .btn {
            display: inline-block;
            padding: 15px 30px;
            background: #667eea;
            color: white;
            text-decoration: none;
            border-radius: 10px;
            font-weight: 600;
            margin: 10px 0;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
        }
        
        .stores {
            display: flex;
            flex-direction: column;
            gap: 15px;
            margin-top: 20px;
        }
        
        .store-badge {
            height: 50px;
        }
        
        #status {
            margin-top: 20px;
            color: #999;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">📇</div>
        <h1>Kundenkarte geteilt!</h1>
        <p>Öffne diese Karte in der Pocketz App, um sie zu speichern.</p>
        
        <a href="#" id="openApp" class="btn">Pocketz öffnen</a>
        
        <div class="stores">
            <a href="https://apps.apple.com/app/pocketz/YOURAPPID" target="_blank">
                <img src="https://tools.applemediaservices.com/api/badges/download-on-the-app-store/black/de-de?size=250x83" 
                     alt="Download on App Store" class="store-badge">
            </a>
            <a href="https://play.google.com/store/apps/details?id=com.yourname.pocketz" target="_blank">
                <img src="https://play.google.com/intl/en_us/badges/static/images/badges/de_badge_web_generic.png" 
                     alt="Get it on Google Play" class="store-badge">
            </a>
        </div>
        
        <p id="status"></p>
    </div>
    <script>
        const appUrl = 'pocketz://share/card/${cardId}${cardData ? '?data=' + cardData : ''}';
        const webUrl = window.location.href;
        
        let appOpened = false;
        let startTime = Date.now();
        
        function tryOpenApp() {
            document.getElementById('status').textContent = 'Versuche App zu öffnen...';
            window.location.href = appUrl;
            
            setTimeout(() => {
                const timeElapsed = Date.now() - startTime;
                
                if (timeElapsed < 2500) {
                    document.getElementById('status').textContent = 
                        'App nicht gefunden. Bitte lade Pocketz herunter!';
                }
            }, 2000);
        }
        
        window.addEventListener('load', () => {
            setTimeout(tryOpenApp, 500);
        });
        
        document.getElementById('openApp').addEventListener('click', (e) => {
            e.preventDefault();
            startTime = Date.now();
            tryOpenApp();
        });
        
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                const timeElapsed = Date.now() - startTime;
                if (timeElapsed > 2500) {
                    appOpened = true;
                    document.getElementById('status').textContent = 
                        'App wurde geöffnet! Du kannst dieses Fenster schließen.';
                }
            }
        });
    </script>
</body>
</html>
  `);
});;*/

app.get('/256.png', (req, res) => {
    res.sendFile('256.png', { root: '.' });
});

app.get('/google_badge.svg', (req, res) => {
    res.sendFile('google_badge.svg', { root: '.' });
});

app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pocketz - Deine Kundenkarten</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #FAFAFA;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
        }

        .header {
            background: white;
            padding: 16px 24px;
            border-bottom: 1px solid #F0F0F0;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .header-logo {
            width: 32px;
            height: 32px;
            background: #0066FF;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
        }

        .header-logo img {
            width: 100%;
            height: 100%;
        }

        .header-text {
            font-size: 20px;
            font-weight: 700;
            color: #1A1A1A;
            letter-spacing: -0.5px;
        }

        .hero {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 60px 24px;
            text-align: center;
        }

        h1 {
            font-size: 48px;
            font-weight: 700;
            color: #1A1A1A;
            letter-spacing: -1px;
            line-height: 1.1;
            margin-bottom: 16px;
        }

        .subtitle {
            font-size: 18px;
            color: #6B6B6B;
            max-width: 500px;
            line-height: 1.6;
            margin-bottom: 32px;
        }

        .btn {
            display: inline-block;
            padding: 16px 32px;
            background: #0066FF;
            color: white;
            text-decoration: none;
            border-radius: 12px;
            font-weight: 600;
            font-size: 16px;
            transition: background 0.2s;
        }

        .btn:hover {
            background: #0052CC;
        }

        .store-badge {
            height: 50px;
            margin-top: 24px;
        }

        @media (prefers-color-scheme: dark) {
            body {
                background: #0A0A0A;
            }

            .header {
                background: #1A1A1A;
                border-bottom-color: #2A2A2A;
            }

            .header-text, h1 {
                color: #FFFFFF;
            }

            .subtitle {
                color: #8B8B8B;
            }
        }

        @media (max-width: 640px) {
            h1 {
                font-size: 32px;
            }

            .subtitle {
                font-size: 16px;
            }
        }
        
        .store-buttons {
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
            justify-content: center;
        }

        .store-badge {
            height: 44px;
        }
    </style>
</head>
<body>
    <header class="header">
        <div class="header-logo">
           <img src="/256.png" alt="Pocketz Logo">
        </div>
        <span class="header-text">Pocketz</span>
    </header>

    <main class="hero">
        <h1>Alle Kundenkarten,<br>immer dabei.</h1>
        <p class="subtitle">Speichere all deine Kundenkarten digital. Scanbar, teilbar, und immer griffbereit.</p>
        
        <a href="https://apps.apple.com/app/pocketz/YOURAPPID" class="btn">Kostenlos herunterladen</a>
        
        <div class="store-buttons">
        <a href="https://apps.apple.com/app/pocketz/YOURAPPID" target="_blank">
            <img src="https://tools.applemediaservices.com/api/badges/download-on-the-app-store/black/de-de?size=250x83" 
                 alt="Download on App Store" class="store-badge">
        </a>
        <a href="https://play.google.com/store/apps/details?id=com.yourname.pocketz" target="_blank">
            <img src="/google_badge.svg" 
                 alt="Get it on Google Play" class="store-badge">
        </a>
        </div>
    </main>
</body>
</html>
  `);
});

app.use((req, res) => {
    res.status(404).send('404 - Not Found');
});

app.listen(PORT, () => {
    console.log(`🚀 Pocketz Server running on http://localhost:${PORT}`);
    console.log(`📱 AASA file: http://localhost:${PORT}/.well-known/apple-app-site-association`);
    console.log(`🔗 Test link: http://localhost:${PORT}/share/card/test123`);
});