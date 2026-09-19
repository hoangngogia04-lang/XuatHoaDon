const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = 3000;

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.ico': 'image/x-icon'
};

const server = http.createServer(async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    const reqUrl = new URL(req.url, `http://localhost:${PORT}`);

    // API Proxy handler for /api/posapp
    if (reqUrl.pathname.startsWith('/api/posapp')) {
        const action = reqUrl.searchParams.get('action');
        const shopId = reqUrl.searchParams.get('shopId');
        const posAppToken = reqUrl.searchParams.get('posAppToken');
        const date = reqUrl.searchParams.get('date') || new Date().toISOString().split('T')[0];

        if (!shopId || !posAppToken) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Missing shopId or posAppToken' }));
            return;
        }

        const posAppHeaders = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'PosApp-Shop-Id': shopId,
            'PosApp-Token': posAppToken,
            'App-Build-Version': 'wcjihrehfun3rtyen123',
            'X-Client-Version': '2.5.0',
            'IP': '115.76.48.104'
        };

        try {
            let fetchRes;
            if (action === 'fetchPosAppOrders' || action === 'fetchOrders') {
                const targetUrl = 'https://admin-api.posapp.vn/api/getOrdersByStatus';
                const posAppPostHeaders = {
                    ...posAppHeaders,
                    'Content-Type': 'application/json'
                };
                const payload = {
                    date_start: date,
                    date_end: date,
                    confirm_date_start: null,
                    confirm_date_end: null,
                    search_key: "",
                    target_shop_id: shopId,
                    arr_order_flg: 0,
                    business_date_flg: false,
                    filter_manage: "{}",
                    status: -1,
                    page: 1,
                    limit: 500,
                    account_id: 0,
                    status_display: "0,1,2,3,4,5,6"
                };
                fetchRes = await fetch(targetUrl, {
                    method: 'POST',
                    headers: posAppPostHeaders,
                    body: JSON.stringify(payload)
                });
            } else {
                const targetUrl = `https://admin-api.posapp.vn/report/top-sale-product?target_shop_id[]=${shopId}&shop_id=${shopId}&date_start=${date}&date_end=${date}&columns[]=product_name&columns[]=quantity&columns[]=unit&group_by=unit&page=1&limit=500&simple_paginate=false`;
                fetchRes = await fetch(targetUrl, { method: 'GET', headers: posAppHeaders });
            }
            const responseText = await fetchRes.text();

            const isJson = fetchRes.headers.get('content-type')?.includes('json') || responseText.trim().startsWith('{') || responseText.trim().startsWith('[');
            res.writeHead(fetchRes.status, { 'Content-Type': isJson ? 'application/json; charset=utf-8' : 'text/html; charset=utf-8' });
            res.end(responseText);
        } catch (err) {
            console.error('Proxy Error:', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
        }
        return;
    }

    // Static File Server
    let filePath = path.join(__dirname, reqUrl.pathname === '/' ? 'index.html' : reqUrl.pathname);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end('<h1>404 Not Found</h1>');
            } else {
                res.writeHead(500);
                res.end(`Server Error: ${err.code}`);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`=================================================`);
    console.log(`🚀 Server PosApp Web đang chạy tại: http://localhost:${PORT}`);
    console.log(`=================================================`);
    // Auto open browser
    const startCmd = process.platform === 'win32' ? `start http://localhost:${PORT}` : `open http://localhost:${PORT}`;
    exec(startCmd);
});
