import { BeatmapSetPOSTRequestBody, SongPUTRequestBody } from "@shared/types";

const API_URL = 'http://localhost:50009'; // change the port number to the one you are using

const fetchWithCORS = async (url: string | Request, options?: RequestInit) => {
  const response = await fetch(url, {
    method: options?.method || 'GET',
		body: options?.body,
    mode: 'cors',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return await response.json();
};

export const getTableNames = async () => {
  const response = await fetchWithCORS(`${API_URL}/tables`);
  return response.data;
};

export const getTableColumns = async (tableName: string) => {
  const response = await fetchWithCORS(`${API_URL}/attributes/${tableName.toUpperCase()}`);
  return response;
};

export const getTableData = async (tableName: string, attributes: string[] = []) => {
	// remove ACTIONS column from attributes without modifying the original array
	const cleanedAttributes = attributes.filter((attribute) => attribute !== 'ACTIONS');
  const response = await fetchWithCORS(`${API_URL}/tables/${tableName.toUpperCase()}${cleanedAttributes.length > 0 ? '?attributes=' + cleanedAttributes.join(',') : ''}`)
  return response;
};

export const getTableDataWithFilter = async (tableName: string, filter: string) => {
	const response = await fetchWithCORS(`${API_URL}/select/${tableName.toUpperCase()}?filters=${filter}`);
	return response;
}

export const getBeatmapsetsData = async (bpmAbove?: number, bpmBelow?: number) => {
	let url = `${API_URL}/beatmapsets`
	if (bpmAbove && bpmBelow) {
		url += `?bpmAbove=${bpmAbove}&bpmBelow=${bpmBelow}`;
	} else if (bpmAbove) {
		url += `?bpmAbove=${bpmAbove}`;
	} else if (bpmBelow) {
		url += `?bpmBelow=${bpmBelow}`;
	}
	const response = await fetchWithCORS(url);
	return response;
}


export const addBeatmapset = async (beatmapSet: any) => {
	const response = await fetchWithCORS(`${API_URL}/beatmapsets`, {
		method: 'PUT',
		body: JSON.stringify(beatmapSet),
	});
	return response;
}

export const updateBeatmapset = async (beatmapSetId: number, data: BeatmapSetPOSTRequestBody) => {
	const response = await fetchWithCORS(`${API_URL}/beatmapsets/${beatmapSetId}`, {
		method: 'POST',
		body: JSON.stringify(data),
	});
	return response;
}

export const deleteBeatmapset = async (id: number) => {
	const response = await fetchWithCORS(`${API_URL}/beatmapsets/${id}`, {
		method: 'DELETE',
	});
	return response;
}

export const addSong = async (match: SongPUTRequestBody) => {
	const response = await fetchWithCORS(`${API_URL}/songs`, {
		method: 'PUT',
		body: JSON.stringify(match),
	});
	return response;
}

export const getPlayersWithAvgScoreGreaterThan = async (score: number) => {	
	const response = await fetchWithCORS(`${API_URL}/players-with-avg-score-greater-than/${score}`);
	return response;
}

export const getAverageAccuracyOfPlayers = async () => {
	const response = await fetchWithCORS(`${API_URL}/players-with-avg-accuracy`);
	return response;
}

export const getMaxAverageAccuracyFromEachModCombo = async () => {
	const response = await fetchWithCORS(`${API_URL}/max-avg-accuracy-per-mod`);
	return response;
}

export const getPlayersWithScoresOnAllBeatmapsets = async () => {
	const response = await fetchWithCORS(`${API_URL}/players-with-all-beatmaps`);
	return response;
}
