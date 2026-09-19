module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { action, shopId, posAppToken, date } = req.query;

    if (!shopId || !posAppToken) {
      return res.status(400).json({ error: 'Missing shopId or posAppToken' });
    }

    const dateStr = date || new Date().toISOString().split('T')[0];

    const posAppHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      'Accept': 'application/json, text/plain, */*',
      'PosApp-Shop-Id': String(shopId),
      'PosApp-Token': String(posAppToken),
      'App-Build-Version': 'wcjihrehfun3rtyen123',
      'X-Client-Version': '2.5.0',
      'IP': '115.76.48.104'
    };

    if (action === 'fetchPosAppOrders' || action === 'fetchOrders') {
      const targetUrl = 'https://admin-api.posapp.vn/api/getOrdersByStatus';
      const posAppPostHeaders = {
        ...posAppHeaders,
        'Content-Type': 'application/json'
      };
      const payload = {
        date_start: dateStr,
        date_end: dateStr,
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

      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: posAppPostHeaders,
        body: JSON.stringify(payload)
      });
      const responseText = await response.text();

      const isJson = response.headers.get('content-type')?.includes('json') || responseText.trim().startsWith('{') || responseText.trim().startsWith('[');
      res.setHeader('Content-Type', isJson ? 'application/json; charset=utf-8' : 'text/html; charset=utf-8');
      return res.status(response.status).send(responseText);
    } else {
      const targetUrl = `https://admin-api.posapp.vn/report/top-sale-product?target_shop_id[]=${shopId}&shop_id=${shopId}&date_start=${dateStr}&date_end=${dateStr}&columns[]=product_name&columns[]=quantity&columns[]=unit&group_by=unit&page=1&limit=500&simple_paginate=false`;
      const response = await fetch(targetUrl, { method: 'GET', headers: posAppHeaders });
      const responseText = await response.text();

      const isJson = response.headers.get('content-type')?.includes('json') || responseText.trim().startsWith('{') || responseText.trim().startsWith('[');
      res.setHeader('Content-Type', isJson ? 'application/json; charset=utf-8' : 'text/html; charset=utf-8');
      return res.status(response.status).send(responseText);
    }
  } catch (error) {
    console.error('API proxy execution error:', error);
    res.status(500).json({ error: error.message });
  }
};
