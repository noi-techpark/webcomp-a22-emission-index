// SPDX-FileCopyrightText: 2025 NOI Techpark <digital@noi.bz.it>
//
// SPDX-License-Identifier: AGPL-3.0-or-later


/**
 * iso-8601 string
 */
export type DateTimeString = string;


/**
 * Data received from api
 */
export interface Datatype<T, M> {
  tname: string;
  tunit: string;
  ttype: T | string;
  tdescription: string;
  tmeasurements: Measurement<M>[];
}

export interface Measurement<M> {
  /**
   * the measured value. Number, string or json object
   */
  mvalue: M;
  /**
   * timestamp of the measurement
   */
  mvalidtime: DateTimeString;
  /**
   * update frequency of this timeseries in seconds. Depending on the dataset this might be an approximation
   */
  mperiod: number;

  mprovenance?: Provenance;
  mtransactiontime?: DateTimeString;
}

/**
 * technical information about the data collection
 */
export interface Provenance {
  prname: string;
  prversion: string;
  prlineage: string;
}


export interface Station {
  sname: string;
  stype: string;
  scode: string;
  sorigin: string;
  sactive: string;
  scoordinate: Coordinate;
  smetadata: any;
}

export interface Coordinate {
  x: number
  y: number
  srid: number;
}
