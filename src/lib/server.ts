import type { Server } from 'node:http';
import { initRedis } from './redis/client.js';
import { initWsServer } from './ws/server.js';
import { getMetricsAgent } from './metrics.js';
import { populateMemList as populateMemMalwareList } from './malware/client.js';
import { populateMemList as populateMemIpRangesList } from './ip-ranges.js';
import { populateMemList as populateIpWhiteList } from './geoip/whitelist.js';

export const createServer = async (): Promise<Server> => {
	// Populate memory malware list
	await populateMemMalwareList();
	// Populate memory cloud regions list
	await populateMemIpRangesList();
	// Populate ip whiltelist
	await populateIpWhiteList();

	await initRedis();
	await initWsServer();

	const { getWsServer } = await import('./ws/server.js');
	const { getHttpServer } = await import('./http/server.js');

	const httpServer = getHttpServer();
	const wsServer = getWsServer();

	wsServer.attach(httpServer);

	await import('./ws/gateway.js');

	const metricsAgent = getMetricsAgent();
	metricsAgent.run();

	return httpServer;
};
