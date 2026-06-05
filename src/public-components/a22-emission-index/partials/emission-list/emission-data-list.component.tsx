// SPDX-FileCopyrightText: 2025 NOI Techpark <digital@noi.bz.it>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Component, Element, Event, EventEmitter, forceUpdate, h, Host, Prop, State, Watch } from "@stencil/core";
import { prepareSearchString } from "../../../../utils/quickSearch";
import { LanguageDataService } from "../../../../data/language/language-data-service";
import { StencilComponent } from "../../../../utils/StencilComponent";
import { EmissionData } from "../../../../data/emissions/EmissionData";

/**
 * (INTERNAL)
 */
@Component({
  tag: 'noi-emission-data-list',
  styleUrl: 'emission-data-list.css',
  scoped: true,
})
export class EmissionDataListComponent implements StencilComponent {

  @Prop({mutable: true})
  stationArr: EmissionData[] | null = null;

  @Prop({mutable: true})
  idSelected: string = null;

  @State()
  searchString: string = null;

  @State()
  stationArrFiltered: EmissionData[] = [];

  @Event()
  itemClick: EventEmitter<EmissionData>;

  @Element() el: HTMLElement;

  languageService: LanguageDataService;

  constructor() {
    this._renderItem = this._renderItem.bind(this);
    this._onLanguageChanged = this._onLanguageChanged.bind(this);

    this.languageService = LanguageDataService.getInstance();
  }

  connectedCallback() {
    this.languageService.onLanguageChange.bind(this._onLanguageChanged);
  }

  disconnectedCallback() {
    this.languageService.onLanguageChange.unbind(this._onLanguageChanged);
  }

  _onLanguageChanged() {
    forceUpdate(this.el);
  }

  filterData(searchString: string) {
    this.searchString = searchString;
  }

  @Watch('searchString')
  @Watch('stationArr')
  onDataChange() {
    if ( !this.searchString) {
      this.stationArrFiltered = this.stationArr;
      return;
    }

    const searchToken = prepareSearchString(this.searchString);
    this.stationArrFiltered = [];
    for (const wc of this.stationArr) {
      const wcToken = prepareSearchString(wc.station.sname);
      if (wcToken.includes(searchToken)) {
        this.stationArrFiltered.push(wc);
      }
    }
  }

  render() {
    return <Host>
      <div class="title-wrapper">
        <div class="title ellipsis">
          <noi-icon class="title__icon" name="stations"></noi-icon>
          <span class="title__text">{this.languageService.translate('app.list.title')}</span>
          <slot name="title"></slot>
        </div>
        <noi-input class="title__search"
                   placeholder={this.languageService.translate('app.list.search.placeholder')}
                   onValueChange={v => this.filterData(v.detail)}></noi-input>
      </div>
      <div class="list">
        {this.stationArrFiltered.map(this._renderItem)}
        {this.stationArrFiltered.length ? '' :
          <div class="no-data">{this.languageService.translate('app.list.empty')}</div>}
      </div>
    </Host>
  }

  _renderItem(station: EmissionData) {

    let itemClass = 'item';
    if (this.idSelected === station.station.scode) {
      itemClass += ' item--selected';
    }
    return (<button type="button"
                    class={itemClass}
                    onClick={() => {this.itemClick.emit(station)} }>

      <div class={'item__wrapper level--' + station.level}>

          <div class="item__title">{station.station.sname}</div>
          <div class="emission">
            <span class="emission__label">{this.languageService.translate('app.parameter.nox')} </span>
            <span class={'emission__value level--' + (station.nox?.mvalue || 'unknown')}>{this.languageService.translate('pollution--' + (station.nox?.mvalue || 'unknown'))} </span>
            <span class="emission__date">{station.nox?.formattedDate || ''}</span>
          </div>

          <div class="emission">
            <span class="emission__label">{this.languageService.translate('app.parameter.co2')} </span>
            <span class={'emission__value level--' + (station.co2?.mvalue || 'unknown')}>{this.languageService.translate('pollution--' + (station.co2?.mvalue || 'unknown'))} </span>
            <span class="emission__date">{station.co2?.formattedDate || ''}</span>
          </div>
    </div>
  </button>)
    ;
  }
}
