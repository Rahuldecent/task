
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express()
function customProxyMiddleware(req, res, next) {
    if (req.path.startsWith('/api')) {
        return createProxyMiddleware({
            target: 'http://localhost:8000',
            changeOrigin: true
        })(req, res, next);
    } else {
        return createProxyMiddleware({
            target: 'http://localhost:5000',
            changeOrigin: true
        })(req, res, next);
    }
}

app.use(customProxyMiddleware);

const PORT = 3000;
app.listen(PORT, () => {
    console.log("API GATEWAY RUNNING")
})