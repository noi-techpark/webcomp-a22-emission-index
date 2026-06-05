// SPDX-FileCopyrightText: 2025 NOI Techpark <digital@noi.bz.it>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

export function prepareSearchString(str: string) {
  return (str || '').toLowerCase().trim()
    .replace(/[^\s\w\']/g, ' ') // replace everything except characters and space
    .replace(/\s+/g, ' '); // replace multiple spaces with single one
}
