export interface Env {
	BUCKET: R2Bucket;
}

export interface LastUpdate {
	fileName: string;
	downloadUrl: string;
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		try {
			const listed = await env.BUCKET.list({
				limit: 720,
				prefix: 'nodebox-dashboard-v',
			});

			let latestVersion: LastUpdate | null = null;
			let highestVersion = [0, 0, 0];

			for (const object of listed.objects) {
				const match = object.key.match(/nodebox-dashboard-v(\d+)\.(\d+)\.(\d+)/);
				if (match) {
					const version = match.slice(1, 4).map(Number);
					if (compareVersions(version, highestVersion) > 0) {
						highestVersion = version;
						latestVersion = {
							fileName: object.key,
							downloadUrl: `https://bucket.nodebox.cloud/${object.key}`,
						};
					}
				}
			}

			if (latestVersion) {
				return new Response(JSON.stringify(latestVersion), {
					headers: { 'Content-Type': 'application/json' },
				});
			} else {
				return new Response(
					JSON.stringify({
						error: 'No NodeBox dashboard versions found',
					}),
					{ status: 404, headers: { 'Content-Type': 'application/json' } }
				);
			}
		} catch (error) {
			return new Response(
				JSON.stringify({
					error: 'Error fetching NodeBox dashboard versions',
				}),
				{ status: 500, headers: { 'Content-Type': 'application/json' } }
			);
		}
	},
} satisfies ExportedHandler<Env>;

function compareVersions(a: number[], b: number[]): number {
	for (let i = 0; i < 3; i++) {
		if (a[i] > b[i]) return 1;
		if (a[i] < b[i]) return -1;
	}
	return 0;
}
