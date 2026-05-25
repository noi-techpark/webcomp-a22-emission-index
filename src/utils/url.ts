// SPDX-FileCopyrightText: 2025 NOI Techpark <digital@noi.bz.it>
//
// SPDX-License-Identifier: AGPL-3.0-or-later


/**
 */
export function buildUrl(base: string, query?: { [key: string]: any }): string {
  if (!query) {
    return base;
  }
  const url = new URL(base);
  for (const k in query) {
    url.searchParams.append(k, query[k]);
  }
  return url.toString();
}
