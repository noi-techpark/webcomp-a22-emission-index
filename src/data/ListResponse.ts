// SPDX-FileCopyrightText: 2025 NOI Techpark <digital@noi.bz.it>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

export interface ListResponse<T> {
  TotalResults: number;
  TotalPages: number;
  CurrentPage: number;
  PreviousPage: string;
  NextPage: string;
  Seed: string;
  Items: T[];
}

export interface ListDataResponse<T> {
  offset: number;
  limit: number;
  data: T[];
}
