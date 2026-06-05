// SPDX-FileCopyrightText: 2025 NOI Techpark <digital@noi.bz.it>
//
// SPDX-License-Identifier: AGPL-3.0-or-later


// origin is used to track usage and traffic patterns
import { ListDataResponse } from "../ListResponse";
import { buildUrl } from "../../utils/url";
import { getAssetPath } from "../../utils/asset-path";
import { EmissionCluster, EmissionData, EmissionData_Flat, EmissionDataLevel } from "./EmissionData";
import { LatLngLiteral } from "leaflet";

const ORIGIN = 'webcomp-brennerlec';

interface EmissionFetchResult {
  clusters: EmissionCluster[];
  stations: EmissionData[];
}

/**
 *
 */
export class EmissionsDataService {

  getRoutePath() {
    const dataPath = getAssetPath('data_a22.json');
    // console.log('[WebcamDataService] dataPath', dataPath);
    return fetch(dataPath)
      .then(r => r.json() as Promise<Array<{ lat: number, lng: number }>>);
  }

  getEmission(): Promise<EmissionFetchResult> {
    // return fetch(buildUrl(`https://mobility.api.opendatahub.testingmachine.eu/v2/flat/TrafficSensor/CO2-emissions-impact,NOx-emissions-dimpact/latest`, {
    return fetch(buildUrl(`https://mobility.api.opendatahub.com/v2/flat/TrafficSensor/CO2-emissions-impact,NOx-emissions-impact/latest`, {
      origin: ORIGIN,
      limit: -1,
    }))
      .then(r => r.json() as Promise<ListDataResponse<EmissionData_Flat>>)
      .then(r => r.data)
      .then(_reduceData);
  }

}


function _reduceData(data: EmissionData_Flat[]): EmissionFetchResult {

  const tsRelevant = Date.now() - 28 * 24 * 60 * 60 * 1000;

  // group stations
  const _stationHash: { [id: string]: EmissionData } = {};
  for (const d of data) {

    const tsDate = new Date(d.mvalidtime).getTime();
    if (tsDate < tsRelevant) {
      // skip old data
      continue;
    }

    if (!_stationHash[d.scode]) {

      let kmPoint = -1;
      try {
        const meta = JSON.parse(d.smetadata['a22_metadata']);
        kmPoint = meta.metro * 1;
      } catch (e) {
        console.warn('Cannot parse metadata', d);
      }

      _stationHash[d.scode] = {
        clusterId: '', // filled later
        coordinate: {
          lat: d.scoordinate.y,
          lng: d.scoordinate.x,
        },
        kmPoint,
        level: '' as any,
        station: {
          scode: d.scode,
          stype: d.stype,
          sname: d.sname,
          sorigin: d.sorigin,
          scoordinate: d.scoordinate,
        },
      };
    }

    switch (d.tname) {
      case 'CO2-emissions-impact':
        if (_stationHash[d.scode].co2) {
          console.warn('Duplicated co2 data for station: ', d.scode);
        }
        _stationHash[d.scode].co2 = {
          tname: d.tname,
          tdescription: d.tdescription,
          mvalue: d.mvalue,
          mvalidtime: d.mvalidtime,

          formattedDate: formatDate(d.mvalidtime),
        };
        break;

      case 'NOx-emissions-impact':
        if (_stationHash[d.scode].nox) {
          console.warn('Duplicated nox data for station: ', d.scode);
        }
        _stationHash[d.scode].nox = {
          tname: d.tname,
          tdescription: d.tdescription,
          mvalue: d.mvalue,
          mvalidtime: d.mvalidtime,

          formattedDate: formatDate(d.mvalidtime),
        };
        break;
      default:
        console.warn('Unknown data type: ', d.tname);
    }
  }

  const stationArr = Object.values(_stationHash).sort((a, b) => a.kmPoint - b.kmPoint);
  for (const s of stationArr) {
    s.level = _calculateStationLevel(s);
  }


  // clusterize data
  const CLUSTER_DIST_SQR = 0.001 * 0.001;

  let uid = 0;
  const clusterArr: EmissionCluster[] = [];
  for (const s of stationArr) {
    let clusterFound = false;
    for (const cl of clusterArr) {
      const dist = _distSqr(s.coordinate, cl.coordinate);
      if (dist < CLUSTER_DIST_SQR) {
        // console.log('  cluster distance2: ', dist);
        clusterFound = true;
        // join cluster
        s.clusterId = cl.uid;
        cl.stations.push(s);
        break; // < stop looking for another cluster
      }
    }
    if (!clusterFound) {
      // separate cluster
      const clusterId = 'cluster-' + (uid++);
      s.clusterId = clusterId;
      clusterArr.push({
        coordinate: s.coordinate,
        level: '' as any, // calculate below
        stations: [s],
        uid: clusterId,
      });
    }
  }

  for (const cl of clusterArr) {
    cl.level = _calculateClusterLevel(cl.stations);

    // TODO: proposal
    cl.northSlowLane = cl.stations.find(s => {
      return s.station.sname.includes('marcia')
        && s.station.sname.includes('nord')
    });

    cl.northFastLane = cl.stations.find(s => {
      return s.station.sname.includes('sorpasso')
        && s.station.sname.includes('nord')
    });
    cl.southSlowLane = cl.stations.find(s => {
      return s.station.sname.includes('marcia')
        && s.station.sname.includes('sud')
    });

    cl.southFastLane = cl.stations.find(s => {
      return s.station.sname.includes('sorpasso')
        && s.station.sname.includes('sud')
    });

    cl.namePretty = cl.stations[0].station.sname
      .replace(/\(corsia.*?\)/, '')
      .replace(/(sud|nord)/i, '');
  }
  return {clusters: clusterArr, stations: stationArr};
}

const _levels_asc: EmissionDataLevel[] = [
  'unknown',
  'low',
  'medium',
  'high',
];

/**
 * rude version
 */
function _distSqr(a: LatLngLiteral, b: LatLngLiteral): number {
  return (a.lat - b.lat) * (a.lat - b.lat) + (a.lng - b.lng) * (a.lng - b.lng);
}

/**
 * @param stations
 */
function _calculateClusterLevel(stations: EmissionData[]): EmissionData['level'] {
  const levels: EmissionDataLevel[] = [];
  for (const s of stations) {
    if (s.nox?.mvalue) {
      levels.push(s.nox.mvalue);
    }
    if (s.co2?.mvalue) {
      levels.push(s.co2.mvalue);
    }
  }

  const levelsIndex = levels.map(v => _levels_asc.indexOf(v))
    .filter(v => v >= 0);
  const maxLevel = Math.max(0, ...levelsIndex);
  return _levels_asc[maxLevel];
}


/**
 * @param station
 */
function _calculateStationLevel(station: EmissionData): EmissionData['level'] {
  const levels = [
    station.nox?.mvalue,
    station.co2?.mvalue,
  ].map(v => _levels_asc.indexOf(v))
    .filter(v => v >= 0);
  const maxLevel = Math.max(0, ...levels);
  return _levels_asc[maxLevel];
}

function formatDate(dateStr: string) {

  try {
    const date = new Date(dateStr);

    const dateFormatted = new Intl.DateTimeFormat(navigator.language, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    }).format(date);
    return dateFormatted;
  } catch (e) {
    console.warn('Invalid date: ', dateStr);
    return dateStr;
  }
}
