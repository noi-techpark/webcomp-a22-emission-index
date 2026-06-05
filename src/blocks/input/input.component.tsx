// SPDX-FileCopyrightText: 2025 NOI Techpark <digital@noi.bz.it>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Component, Event, EventEmitter, h, Host, Prop, State } from "@stencil/core";

/**
 * (INTERNAL) render an input with prefix and clear button
 *
 * Prefix are hardcoded to 'search' icon for now.
 *
 * @part input-prefix - prefix component
 * @part input-native - Native input
 * @part clear-btn - clear input button
 */
@Component({
  tag: 'noi-input',
  styleUrl: 'input.css',
  shadow: true,
})
export class InputComponent {

  /**
   * Input placeholder
   */
  @Prop({mutable: true})
  placeholder: string;

  /**
   * Emitted when value is changed
   */
  @Event() valueChange: EventEmitter<string>;

  @State()
  hasValue = false;

  private nativeInput?: HTMLInputElement;

  onValueChanged() {
    const value = this.nativeInput?.value;
    this.hasValue = !!value;
    this.valueChange.emit(value);
  }

  clearValue() {
    this.nativeInput.value = '';
    this.hasValue = false;
    this.valueChange.emit('');
  }

  render() {
    let hostClass = 'input input--prefix input--suffix';
    return <Host class={hostClass}>
      <div class="input__prefix" part="input-prefix">
        <noi-icon name="search"></noi-icon>
      </div>
      <input class="input__input"
             part="input-native"
             ref={(input) => (this.nativeInput = input)}
             placeholder={this.placeholder}
             onInput={() => this.onValueChanged()}
      />
      <div class="input__suffix">
        <noi-button class="input__clear-btn" part="clear-btn" disabled={ !this.hasValue} iconOnly={true} onBtnClick={() => this.clearValue()}>
          <noi-icon name="close"></noi-icon>
        </noi-button>
      </div>
    </Host>;
  }
}
