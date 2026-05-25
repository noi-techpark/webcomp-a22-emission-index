// SPDX-FileCopyrightText: 2025 NOI Techpark <digital@noi.bz.it>
//
// SPDX-License-Identifier: AGPL-3.0-or-later


// origin is used to track usage and traffic patterns
import { EmissionCluster, EmissionData } from "../EmissionData";


interface EmissionFetchResult {
  clusters: EmissionCluster[];
  stations: EmissionData[];
}

/**
 *
 */
export class EmissionsDataService {

  getRoutePath() {
    return Promise.resolve([]);
  }

  getEmission(): Promise<EmissionFetchResult> {
    return Promise.resolve({clusters: [], stations: []});
  }

}
