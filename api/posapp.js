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
    const { action, shopId, posAppToken, date, status, page, limit } = req.query;

    if (!shopId || !posAppToken) {
      return res.status(400).json({ error: 'Missing shopId or posAppToken' });
    }

    const posAppHeaders = {
      'Accept': 'application/json, text/plain, */*',
      'PosApp-Shop-Id': shopId,
      'PosApp-Token': posAppToken,
      'App-Build-Version': 'wcjihrehfun3rtyen123',
      'X-Client-Version': '2.5.0',
      'IP': '115.76.48.104'
    };

    if (action === 'fetchPosAppOrders' || action === 'fetchOrders') {
      const dateStart = date || new Date().toISOString().split('T')[0];
      const dateEnd = dateStart;
      const currentPage = page || '1';
      const currentLimit = limit || '100';
      const orderStatus = status || '';

      // Try PosApp Order Endpoint
      const targetUrl = `https://admin-api.posapp.vn/api/order?target_shop_id[]=${shopId}&shop_id=${shopId}&date_start=${dateStart}&date_end=${dateEnd}&page=${currentPage}&limit=${currentLimit}&status=${orderStatus}`;
      
      const response = await fetch(targetUrl, { method: 'GET', headers: posAppHeaders });
      const responseText = await response.text();

      res.setHeader('Content-Type', 'application/json');
      return res.status(response.status).send(responseText);
    }

    if (action === 'fetchPosAppSales') {
      const dateStart = date || new Date().toISOString().split('T')[0];
      const targetUrl = `https://admin-api.posapp.vn/report/top-sale-product?target_shop_id[]=${shopId}&shop_id=${shopId}&date_start=${dateStart}&date_end=${dateStart}&columns[]=product_name&columns[]=quantity&columns[]=unit&group_by=unit&page=1&limit=100&simple_paginate=false`;
      
      const response = await fetch(targetUrl, { method: 'GET', headers: posAppHeaders });
      const responseText = await response.text();

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(response.status).send(responseText);
    }

    if (action === 'fetchPosAppRevenue') {
      const dateStart = date || new Date().toISOString().split('T')[0];
      const targetUrl = 'https://admin-api.posapp.vn/api/reportDashboardSummaryDaily';
      const headers = {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/x-www-form-urlencoded',
        'App-Build-Version': 'wcjihrehfun3rtyen123',
        'X-Client-Version': '2.5.0',
        'IP': '115.76.48.104'
      };
      const bodyParams = new URLSearchParams({
        date_start: dateStart,
        date_end: dateStart,
        target_shop_id: shopId,
        page: '1',
        limit: '10',
        shop_id: shopId,
        token: posAppToken
      });
      const response = await fetch(targetUrl, { method: 'POST', headers, body: bodyParams.toString() });
      const responseJson = await response.json();
      return res.status(response.status).json(responseJson);
    }

    return res.status(400).json({ error: 'Invalid action' });
  } catch (error) {
    console.error('API proxy execution error:', error);
    res.status(500).json({ error: error.message });
  }
};
