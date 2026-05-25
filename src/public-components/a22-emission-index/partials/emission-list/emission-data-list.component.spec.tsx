// SPDX-FileCopyrightText: 2025 NOI Techpark <digital@noi.bz.it>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

// mocks should come before other imports
import "../../../../mocks";

import { h } from '@stencil/core';
import { newSpecPage } from "@stencil/core/testing";
import { EmissionDataListComponent } from "./emission-data-list.component";

describe('noi-emission-data-list', () => {
  it('should render component', async () => {

    const page = await newSpecPage({
      components: [EmissionDataListComponent],
      template: () => (<noi-emission-data-list></noi-emission-data-list>),
    });

    expect(!!page.root.querySelector('.title')).toBe(true);
  });
});
