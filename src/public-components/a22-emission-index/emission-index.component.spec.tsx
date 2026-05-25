// SPDX-FileCopyrightText: 2025 NOI Techpark <digital@noi.bz.it>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

// mocks should come before other imports
import "../../mocks";

import { h } from '@stencil/core';
import { EmissionIndexComponent } from "./emission-index.component";
import { newSpecPage } from "@stencil/core/testing";

describe('noi-a22-emission-index', () => {
  EmissionIndexComponent.prototype._watchSize = () => null; // no ResizeObserver in mock

  it('should render component', async () => {

    const page = await newSpecPage({
      components: [EmissionIndexComponent],
      template: () => (<noi-a22-emission-index></noi-a22-emission-index>),
    });

    expect(page.root.classList.contains('layout')).toBe(true);
  });

});
