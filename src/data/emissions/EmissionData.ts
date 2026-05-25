// SPDX-FileCopyrightText: 2025 NOI Techpark <digital@noi.bz.it>
//
// SPDX-License-Identifier: AGPL-3.0-or-later


import { Coordinate, Datatype, Measurement, Station } from "../types-v1-common";
import { LatLngLiteral } from "leaflet";

export type EmissionDataLevel = 'unknown' | 'low' | 'medium' | 'high';
export type EmissionDataType = 'CO2-emissions-impact' | 'NOx-emissions-impact';

export type EmissionData_Flat =
  Datatype<EmissionDataType, EmissionDataLevel>
  & Measurement<EmissionDataLevel>
  & Station;

// & Provenance & Parent


/**
 *
 */
export interface EmissionCluster {
  uid: string;
  coordinate: LatLngLiteral;
  level: EmissionDataLevel;

  stations: EmissionData[];

  // TODO: proposal
  namePretty?: string;
  northFastLane?: EmissionData;
  northSlowLane?: EmissionData;
  southFastLane?: EmissionData;
  southSlowLane?: EmissionData;
}

/**
 *
 */
export interface EmissionData {
  coordinate: LatLngLiteral;
  kmPoint: number;
  level: EmissionDataLevel;
  clusterId: string;

  station: {
    scode: string;
    scoordinate: Coordinate;
    sname: string;
    sorigin: "A22" | string;
    stype: "TrafficSensor" | string;
  };

  nox?: EmissionMeasurement;
  co2?: EmissionMeasurement;
}

export interface EmissionMeasurement {
  tdescription: string;
  tname: EmissionDataType;
  mvalidtime: string;
  mvalue: EmissionDataLevel;

  formattedDate: string;
}
