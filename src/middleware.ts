import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Set to true to enable maintenance mode globally
const MAINTENANCE_MODE = true;

const MAINTENANCE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Under Maintenance | Lifestyle Medicine Gateway</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --primary: #10b981;
      --primary-dark: #059669;
      --bg: #090d16;
      --card-bg: rgba(255, 255, 255, 0.03);
      --card-border: rgba(255, 255, 255, 0.08);
      --text: #f8fafc;
      --text-muted: #94a3b8;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: 'Outfit', sans-serif;
      background: radial-gradient(circle at center, #0f1d1a 0%, var(--bg) 100%);
      color: var(--text);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      overflow: hidden;
    }
    .container {
      max-width: 480px;
      width: 100%;
      text-align: center;
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      padding: 50px 40px;
      border-radius: 24px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1);
      animation: fadeIn 0.8s ease-out;
    }
    .logo-symbol {
      width: 80px;
      height: 80px;
      margin: 0 auto 30px;
      background: linear-gradient(135deg, var(--primary) 0%, #34d399 100%);
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 38px;
      box-shadow: 0 10px 20px rgba(16, 185, 129, 0.2);
      animation: pulse 2s infinite ease-in-out;
    }
    h1 {
      font-size: 32px;
      font-weight: 800;
      letter-spacing: -0.03em;
      margin-bottom: 16px;
      background: linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    p {
      color: var(--text-muted);
      font-size: 16px;
      line-height: 1.6;
      margin-bottom: 30px;
    }
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.2);
      color: var(--primary);
      padding: 8px 16px;
      border-radius: 100px;
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 24px;
    }
    .status-dot {
      width: 8px;
      height: 8px;
      background: var(--primary);
      border-radius: 50%;
      animation: blink 1.5s infinite;
    }
    .footer {
      font-size: 12px;
      color: #64748b;
      margin-top: 10px;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }
    @keyframes blink {
      0%, 100% { opacity: 0.3; }
      50% { opacity: 1; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo-symbol">🌱</div>
    <div class="status-badge">
      <div class="status-dot"></div>
      Under Maintenance
    </div>
    <h1>We'll Be Back Soon</h1>
    <p>Lifestyle Medicine Gateway is currently undergoing scheduled updates. We appreciate your patience and will be back online shortly.</p>
    <div class="footer">
      &copy; 2026 Lifestyle Medicine Gateway. All rights reserved.
    </div>
  </div>
</body>
</html>`;

export function middleware(request: NextRequest) {
  const host = request.headers.get('host');
  
  // If the request is coming from the Vercel default domain
  if (host === 'lmgnew.vercel.app') {
    const url = request.nextUrl.clone();
    url.host = 'lifestylemedicinegateway.com';
    url.protocol = 'https';
    
    // Perform a permanent redirect to the custom domain
    return NextResponse.redirect(url, 301);
  }

  if (MAINTENANCE_MODE) {
    return new NextResponse(MAINTENANCE_HTML, {
      status: 503,
      headers: {
        'content-type': 'text/html; charset=utf-8',
      },
    });
  }
  
  return NextResponse.next();
}

// Only run on page routes, not assets/api
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
