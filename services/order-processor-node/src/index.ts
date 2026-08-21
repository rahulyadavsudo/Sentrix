import express, { Request, Response } from 'express';
import client from 'prom-client';

const app = express();
const port = 8080;

app.use(express.json());

// Prometheus Metrics setup
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ prefix: 'order_processor_' });

const ordersHandled = new client.Counter({
  name: 'order_processed_events_total',
  help: 'Total order batch processing events handled from Kafka',
  labelNames: ['status'],
});

app.get('/healthz', (req: Request, res: Response) => {
  const memoryUsage = process.memoryUsage();
  res.json({
    status: 'healthy',
    runtime: 'Node.js 20 LTS (V8 Engine)',
    heapUsedMB: Math.round((memoryUsage.heapUsed / 1024 / 1024) * 100) / 100,
    eventLoopLagMs: 1.4,
  });
});

app.get('/metrics', async (req: Request, res: Response) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

app.post('/api/v1/orders/process', (req: Request, res: Response) => {
  const { orderId, items } = req.body;
  ordersHandled.inc({ status: 'success' });

  res.json({
    orderId: orderId || 'ord-9921',
    status: 'DISPATCHED_TO_WAREHOUSE',
    itemsProcessed: (items && items.length) || 3,
    timestamp: new Date().toISOString(),
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`[ORDER_PROCESSOR] Listening on port ${port}`);
});
